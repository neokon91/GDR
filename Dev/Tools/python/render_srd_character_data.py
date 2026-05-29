#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

from template_factory_utils import ROOT, load_yaml

sys.dont_write_bytecode = True

MODULE = ROOT / "Dev" / "Source" / "YAML" / "canonical" / "srd_character_build.yaml"
OUT_DIR = ROOT / "z.automazioni" / "data" / "srd"
CORE_OUT = OUT_DIR / "core.json"
OPTIONS_OUT = OUT_DIR / "opzioni_personaggio.json"
GENERATED_BY = "import_srd_character_data"


def rel_path(path: Path) -> str:
    return str(path.relative_to(ROOT))


def keys(value: Any) -> list[str]:
    return list(value.keys()) if isinstance(value, dict) else []


def read_json(path: Path, errors: list[str]) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        errors.append(f"JSON non valido: {rel_path(path)}")
        return None


def stable_json(payload: dict[str, Any]) -> str:
    return f"{json.dumps(payload, ensure_ascii=False, indent=2)}\n"


def generated_payload(payload: dict[str, Any]) -> dict[str, Any]:
    output = dict(payload)
    output["generated_by"] = GENERATED_BY
    return output


def normalize(value: Any) -> Any:
    if isinstance(value, list):
        return [normalize(item) for item in value]
    if isinstance(value, dict):
        return {str(key): normalize(child) for key, child in sorted(value.items(), key=lambda item: str(item[0]))}
    return value


def require_object(errors: list[str], value: Any, label: str) -> bool:
    if not isinstance(value, dict):
        errors.append(f"{label}: oggetto mancante o non valido")
        return False
    return True


def require_non_empty_object(errors: list[str], value: Any, label: str) -> bool:
    if not require_object(errors, value, label):
        return False
    if not value:
        errors.append(f"{label}: oggetto vuoto")
        return False
    return True


def assert_refs(errors: list[str], refs: Any, valid: set[str], label: str) -> None:
    for ref in refs or []:
        if ref not in valid:
            errors.append(f"{label}: riferimento non valido ({ref})")


def choice_options(choice: Any) -> list[Any]:
    if not isinstance(choice, dict):
        return []
    return choice.get("opzioni", []) if isinstance(choice.get("opzioni"), list) else []


def source_payload() -> tuple[dict[str, Any], dict[str, Any]]:
    if not MODULE.exists():
        raise FileNotFoundError(f"Modulo SRD mancante: {rel_path(MODULE)}")
    module = load_yaml(MODULE)
    core = module.get("core") if isinstance(module.get("core"), dict) else {}
    options = module.get("opzioni") if isinstance(module.get("opzioni"), dict) else {}
    return core, options


def render_outputs() -> tuple[str, str, dict[str, Any], dict[str, Any]]:
    core, options = source_payload()
    if not isinstance(core.get("statistiche"), list) or not core.get("statistiche"):
        raise ValueError("srd_character_build.yaml: core.statistiche mancante o vuoto")
    if not isinstance(options.get("classi"), dict) or not options.get("classi"):
        raise ValueError("srd_character_build.yaml: opzioni.classi mancante o vuoto")
    core_payload = generated_payload(core)
    options_payload = generated_payload(options)
    return stable_json(core_payload), stable_json(options_payload), core_payload, options_payload


def assert_generated_from_source(errors: list[str], core: Any, options: Any) -> None:
    expected_core, expected_options = source_payload()
    expected_core_payload = generated_payload(expected_core)
    expected_options_payload = generated_payload(expected_options)

    if normalize(core) != normalize(expected_core_payload):
        errors.append("core.json: non allineato a srd_character_build.yaml; eseguire npm run sync:sources")
    if normalize(options) != normalize(expected_options_payload):
        errors.append("opzioni_personaggio.json: non allineato a srd_character_build.yaml; eseguire npm run sync:sources")


def validate_core(errors: list[str], core: dict[str, Any]) -> dict[str, set[str]]:
    if not isinstance(core.get("statistiche"), list) or len(core.get("statistiche", [])) != 6:
        errors.append("core.statistiche: servono esattamente 6 caratteristiche")
    stats = set(core.get("statistiche", []) or [])
    if len(stats) != len(core.get("statistiche", []) or []):
        errors.append("core.statistiche: valori duplicati")

    if require_non_empty_object(errors, core.get("abilita"), "core.abilita"):
        for slug, skill_value in core.get("abilita", {}).items():
            skill = skill_value if isinstance(skill_value, dict) else {}
            if not skill.get("label"):
                errors.append(f"core.abilita.{slug}: label mancante")
            if skill.get("stat") not in stats:
                errors.append(f"core.abilita.{slug}: stat non valida ({skill.get('stat')})")

    skills = set(keys(core.get("abilita")))
    armor_categories = set(keys(core.get("categorie_armature")))
    weapon_categories = set(keys(core.get("categorie_armi")))

    if not armor_categories:
        errors.append("core.categorie_armature: nessuna categoria")
    if not weapon_categories:
        errors.append("core.categorie_armi: nessuna categoria")

    methods = ((core.get("generazione_caratteristiche") or {}).get("metodi") or {})
    standard_array = ((methods.get("array_standard") or {}).get("valori") or [])
    if not isinstance(standard_array, list) or len(standard_array) != len(stats):
        errors.append("generazione_caratteristiche.array_standard: valori non allineati alle statistiche")

    point_buy = methods.get("point_buy")
    if (
        not isinstance(point_buy, dict)
        or point_buy.get("punti") != 27
        or point_buy.get("minimo") != 8
        or point_buy.get("massimo") != 15
    ):
        errors.append("generazione_caratteristiche.point_buy: contratto 27 punti 8-15 non rispettato")
    else:
        costs = point_buy.get("costi") if isinstance(point_buy.get("costi"), dict) else {}
        for score in range(int(point_buy["minimo"]), int(point_buy["massimo"]) + 1):
            if not isinstance(costs.get(score, costs.get(str(score))), int):
                errors.append(f"generazione_caratteristiche.point_buy: costo mancante per {score}")

    return {"stats": stats, "skills": skills, "armor_categories": armor_categories, "weapon_categories": weapon_categories}


def validate_classes(errors: list[str], classes: Any, core_refs: dict[str, set[str]]) -> None:
    if not require_non_empty_object(errors, classes, "opzioni.classi"):
        return

    for slug, class_value in classes.items():
        cls = class_value if isinstance(class_value, dict) else {}
        if not cls.get("label"):
            errors.append(f"opzioni.classi.{slug}: label mancante")
        if cls.get("dadi_vita") not in {6, 8, 10, 12}:
            errors.append(f"opzioni.classi.{slug}: dadi_vita non valido")
        if not isinstance(cls.get("save_prof"), list) or len(cls.get("save_prof", [])) != 2:
            errors.append(f"opzioni.classi.{slug}: save_prof deve avere 2 caratteristiche")
        assert_refs(errors, cls.get("save_prof"), core_refs["stats"], f"opzioni.classi.{slug}.save_prof")

        skill_choice = cls.get("abilita") if isinstance(cls.get("abilita"), dict) else {}
        if not isinstance(skill_choice.get("scelte"), int) or skill_choice.get("scelte") < 0:
            errors.append(f"opzioni.classi.{slug}.abilita: scelte non valido")
        if skill_choice.get("opzioni") != "qualsiasi":
            if not isinstance(skill_choice.get("opzioni"), list) or len(skill_choice.get("opzioni", [])) < skill_choice.get("scelte", 0):
                errors.append(f"opzioni.classi.{slug}.abilita: opzioni insufficienti")
            assert_refs(errors, skill_choice.get("opzioni"), core_refs["skills"], f"opzioni.classi.{slug}.abilita.opzioni")

        assert_refs(errors, cls.get("addestramento_armature"), core_refs["armor_categories"], f"opzioni.classi.{slug}.addestramento_armature")
        assert_refs(errors, cls.get("addestramento_armi"), core_refs["weapon_categories"], f"opzioni.classi.{slug}.addestramento_armi")


def validate_species(errors: list[str], species: Any) -> None:
    if not require_non_empty_object(errors, species, "opzioni.specie"):
        return

    for slug, species_value in species.items():
        species_map = species_value if isinstance(species_value, dict) else {}
        if not species_map.get("label"):
            errors.append(f"opzioni.specie.{slug}: label mancante")
        traits = species_map.get("tratti")
        if not require_non_empty_object(errors, traits, f"opzioni.specie.{slug}.tratti"):
            continue
        for trait_slug, trait_value in traits.items():
            trait = trait_value if isinstance(trait_value, dict) else {}
            if not trait.get("label"):
                errors.append(f"opzioni.specie.{slug}.tratti.{trait_slug}: label mancante")
            if not trait.get("descrizione"):
                errors.append(f"opzioni.specie.{slug}.tratti.{trait_slug}: descrizione mancante")
            if trait.get("tipo") == "scelta" and not keys(trait.get("opzioni")):
                errors.append(f"opzioni.specie.{slug}.tratti.{trait_slug}: scelta senza opzioni")


def validate_talents(errors: list[str], talents: Any, stats: set[str]) -> set[str]:
    talent_ids = set(keys(talents))
    if not require_non_empty_object(errors, talents, "opzioni.talenti"):
        return talent_ids

    for slug, talent_value in talents.items():
        talent = talent_value if isinstance(talent_value, dict) else {}
        if not talent.get("label"):
            errors.append(f"opzioni.talenti.{slug}: label mancante")
        if talent.get("categoria") != "origini":
            errors.append(f"opzioni.talenti.{slug}: solo talenti di origine ammessi in questa fase")
        if not isinstance(talent.get("repeatable"), bool):
            errors.append(f"opzioni.talenti.{slug}: repeatable deve essere booleano")
        if not require_object(errors, talent.get("benefici"), f"opzioni.talenti.{slug}.benefici"):
            continue

        if talent.get("base") == "iniziato_alla_magia":
            choices = talent.get("scelte") if isinstance(talent.get("scelte"), dict) else {}
            assert_refs(
                errors,
                choice_options(choices.get("caratteristica_incantatore")),
                stats,
                f"opzioni.talenti.{slug}.scelte.caratteristica_incantatore",
            )
            lists = set(choice_options(choices.get("lista_incantesimi")))
            if not all(item in {"chierico", "druido", "mago"} for item in lists):
                errors.append(f"opzioni.talenti.{slug}: lista_incantesimi non supportata")
    return talent_ids


def validate_backgrounds(errors: list[str], backgrounds: Any, core_refs: dict[str, set[str]], talents: set[str]) -> None:
    if not require_non_empty_object(errors, backgrounds, "opzioni.background"):
        return

    for slug, background_value in backgrounds.items():
        background = background_value if isinstance(background_value, dict) else {}
        if not background.get("label"):
            errors.append(f"opzioni.background.{slug}: label mancante")
        assert_refs(errors, background.get("competenze_abilita"), core_refs["skills"], f"opzioni.background.{slug}.competenze_abilita")
        ability_increases = background.get("aumento_caratteristiche") if isinstance(background.get("aumento_caratteristiche"), dict) else {}
        assert_refs(errors, ability_increases.get("opzioni"), core_refs["stats"], f"opzioni.background.{slug}.aumento_caratteristiche.opzioni")
        assert_refs(errors, background.get("talento_origine"), talents, f"opzioni.background.{slug}.talento_origine")
        if not isinstance(background.get("competenze_abilita"), list) or len(background.get("competenze_abilita", [])) < 2:
            errors.append(f"opzioni.background.{slug}: competenze_abilita insufficienti")


def check_outputs() -> list[str]:
    errors: list[str] = []
    core = read_json(CORE_OUT, errors)
    options = read_json(OPTIONS_OUT, errors)
    if core is None or options is None:
        return errors
    if core.get("generated_by") != GENERATED_BY:
        errors.append("core.json: generated_by non allineato")
    if options.get("generated_by") != GENERATED_BY:
        errors.append("opzioni_personaggio.json: generated_by non allineato")

    assert_generated_from_source(errors, core, options)
    core_refs = validate_core(errors, core)
    validate_classes(errors, options.get("classi"), core_refs)
    validate_species(errors, options.get("specie"))
    talents = validate_talents(errors, options.get("talenti"), core_refs["stats"])
    validate_backgrounds(errors, options.get("background"), core_refs, talents)
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Renderizza e verifica i dati SRD per il wizard personaggio.")
    parser.add_argument("--check", action="store_true", help="Verifica i JSON generati senza scrivere file.")
    args = parser.parse_args()

    if args.check:
        errors = check_outputs()
        if errors:
            for error in errors:
                print(error, file=sys.stderr)
            return 1
        core = json.loads(CORE_OUT.read_text(encoding="utf-8"))
        options = json.loads(OPTIONS_OUT.read_text(encoding="utf-8"))
        print(
            "SRD character data OK: "
            f"{len(keys(options.get('classi')))} classi, "
            f"{len(keys(options.get('specie')))} specie, "
            f"{len(keys(options.get('background')))} background, "
            f"{len(keys(options.get('talenti')))} talenti, "
            f"{len(keys(core.get('abilita')))} abilita."
        )
        return 0

    try:
        core_json, options_json, _core_payload, options_payload = render_outputs()
    except (FileNotFoundError, ValueError) as error:
        print(error, file=sys.stderr)
        return 1

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    CORE_OUT.write_text(core_json, encoding="utf-8")
    OPTIONS_OUT.write_text(options_json, encoding="utf-8")
    print(
        "SRD character data importato: "
        f"{len(keys(options_payload.get('classi')))} classi, "
        f"{len(keys(options_payload.get('specie')))} specie, "
        f"{len(keys(options_payload.get('background')))} background."
    )
    print(f"Output: {rel_path(OUT_DIR)}/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

const TAXONOMY = {
    luogo: {
        label: "Luogo",
        defaultFolder: "luoghi",
        families: [
            {
                id: "fisico",
                label: "Geografia fisica",
                folder: "luoghi",
                category: "luogo",
                items: [
                    ["catena montuosa", "Catena montuosa"],
                    ["fiume o delta", "Fiume o delta"],
                    ["mare arcipelago o costa", "Mare, arcipelago o costa"],
                    ["deserto steppa tundra foresta palude", "Deserto, steppa, tundra, foresta o palude"],
                    ["vulcano faglia cratere rovina geologica", "Vulcano, faglia, cratere o rovina geologica"],
                    ["sottosuolo caverna mondo regione planare", "Sottosuolo, caverna-mondo o regione planare"],
                    ["fenomeno naturale anomalo", "Fenomeno naturale anomalo"]
                ]
            },
            {
                id: "politico",
                label: "Geografia politica",
                folder: "luoghi",
                category: "luogo",
                items: [
                    ["citta-stato", "Citta-stato"],
                    ["federazione", "Federazione"],
                    ["teocrazia", "Teocrazia"],
                    ["protettorato", "Protettorato"],
                    ["colonia", "Colonia"],
                    ["enclave", "Enclave"],
                    ["zona contesa", "Zona contesa"],
                    ["confederazione nomade", "Confederazione nomade"],
                    ["marca militare", "Marca militare"]
                ]
            },
            {
                id: "abitato",
                label: "Abitato o infrastruttura",
                folder: "luoghi",
                category: "luogo",
                items: [
                    ["insediamento", "Insediamento"],
                    ["porto", "Porto"],
                    ["fortezza", "Fortezza"],
                    ["mercato", "Mercato"],
                    ["strada o ponte", "Strada o ponte"]
                ]
            },
            {
                id: "sacro",
                label: "Sacro",
                folder: "luoghi",
                category: "luogo",
                items: [
                    ["tempio", "Tempio"],
                    ["santuario", "Santuario"],
                    ["reliquiario", "Reliquiario"],
                    ["luogo sacro", "Luogo sacro"]
                ]
            },
            {
                id: "pericoloso",
                label: "Pericoloso",
                folder: "luoghi",
                category: "luogo",
                items: [
                    ["dungeon", "Dungeon"],
                    ["rovina", "Rovina"],
                    ["tana", "Tana"],
                    ["frontiera ostile", "Frontiera ostile"]
                ]
            },
            {
                id: "bozza",
                label: "Non so ancora",
                folder: "luoghi",
                category: "luogo",
                items: [["luogo da scoprire", "Bozza utile"]]
            }
        ]
    },
    societa: {
        label: "Societa",
        defaultFolder: "societa",
        families: [{
            id: "struttura",
            label: "Struttura sociale",
            folder: "societa",
            category: "societa",
            items: [
                ["ceto sociale", "Ceto sociale"],
                ["clan casata o famiglia", "Clan, casata o famiglia"],
                ["istituzione civile", "Istituzione civile"],
                ["legge o codice", "Legge o codice"],
                ["crimine organizzato", "Crimine organizzato"],
                ["accademia o scuola", "Accademia o scuola"],
                ["burocrazia", "Burocrazia"],
                ["gilda non economica", "Gilda non economica"],
                ["movimento popolare", "Movimento popolare"],
                ["societa da definire", "Non so ancora"]
            ]
        }]
    },
    cultura: {
        label: "Cultura",
        defaultFolder: "culture",
        families: [{
            id: "pratiche",
            label: "Pratiche culturali",
            folder: "culture",
            category: "cultura",
            items: [
                ["festa o calendario rituale", "Festa o calendario rituale"],
                ["tabu", "Tabu"],
                ["rito di passaggio", "Rito di passaggio"],
                ["costume quotidiano", "Costume quotidiano"],
                ["cucina e ospitalita", "Cucina e ospitalita"],
                ["matrimonio famiglia e parentela", "Matrimonio, famiglia e parentela"],
                ["funerali e memoria", "Funerali e memoria"],
                ["duello onore e vendetta", "Duello, onore e vendetta"],
                ["arte musica teatro moda", "Arte, musica, teatro o moda"],
                ["cultura da definire", "Non so ancora"]
            ]
        }]
    },
    religione: {
        label: "Religione e mito",
        defaultFolder: "religioni",
        families: [{
            id: "mito",
            label: "Religione e mito",
            folder: "religioni",
            category: "religione",
            items: [
                ["pantheon", "Pantheon"],
                ["divinita", "Divinita"],
                ["santo profeta o eroe mitico", "Santo, profeta o eroe mitico"],
                ["eresia", "Eresia"],
                ["ordine religioso", "Ordine religioso"],
                ["reliquia", "Reliquia"],
                ["luogo sacro", "Luogo sacro"],
                ["profezia", "Profezia"],
                ["pratica quotidiana", "Pratica quotidiana"],
                ["mito da definire", "Non so ancora"]
            ]
        }]
    },
    magia: {
        label: "Magia e cosmologia",
        defaultFolder: "cosmologia",
        families: [{
            id: "arcano",
            label: "Magia e cosmologia",
            folder: "cosmologia",
            category: "cosmologia",
            items: [
                ["legge arcana", "Legge arcana"],
                ["scuola o tradizione magica", "Scuola o tradizione magica"],
                ["risorsa magica", "Risorsa magica"],
                ["fenomeno magico", "Fenomeno magico"],
                ["patto", "Patto"],
                ["contaminazione", "Contaminazione"],
                ["soglia o portale", "Soglia o portale"],
                ["anomalia", "Anomalia"],
                ["piano reame o aldila", "Piano, reame o aldila"],
                ["mistero arcano", "Non so ancora"]
            ]
        }]
    },
    economia: {
        label: "Economia",
        defaultFolder: "risorse_mondo",
        families: [{
            id: "scambio",
            label: "Economia",
            folder: "risorse_mondo",
            category: "risorsa",
            items: [
                ["merce strategica", "Merce strategica"],
                ["miniera cava foresta o fonte", "Miniera, cava, foresta o fonte"],
                ["porto mercato fiera o caravanserraglio", "Porto, mercato, fiera o caravanserraglio"],
                ["monopolio", "Monopolio"],
                ["rotta illegale", "Rotta illegale"],
                ["debito o banca", "Debito o banca"],
                ["carestia", "Carestia"],
                ["tecnologia produttiva", "Tecnologia produttiva"],
                ["oggetto di prestigio", "Oggetto di prestigio"],
                ["leva economica da definire", "Non so ancora"]
            ]
        }]
    },
    ecologia: {
        label: "Creature ed ecologia",
        defaultFolder: "creature",
        families: [{
            id: "ecosistema",
            label: "Creature ed ecologia",
            folder: "creature",
            category: "creatura",
            items: [
                ["habitat", "Habitat"],
                ["migrazione", "Migrazione"],
                ["catena alimentare", "Catena alimentare"],
                ["variante regionale", "Variante regionale"],
                ["creatura sacra", "Creatura sacra"],
                ["mostro sociale", "Mostro sociale"],
                ["specie senziente", "Specie senziente"],
                ["predatore territoriale", "Predatore territoriale"],
                ["piaga sciame o invasione", "Piaga, sciame o invasione"],
                ["ecosistema da definire", "Non so ancora"]
            ]
        }]
    },
    storia: {
        label: "Storia",
        defaultFolder: "storia",
        families: [{
            id: "evento",
            label: "Storia",
            folder: "storia",
            category: "evento storico",
            items: [
                ["dinastia", "Dinastia"],
                ["guerra", "Guerra"],
                ["migrazione", "Migrazione"],
                ["catastrofe", "Catastrofe"],
                ["rivoluzione", "Rivoluzione"],
                ["scoperta", "Scoperta"],
                ["trattato", "Trattato"],
                ["eta mitica", "Eta mitica"],
                ["cronologia concorrente", "Cronologia concorrente"],
                ["evento da definire", "Non so ancora"]
            ]
        }]
    }
};

function getTaxonomy(kind) {
    return TAXONOMY[kind] ?? null;
}

function getAllKinds() {
    return Object.keys(TAXONOMY);
}

module.exports = {
    TAXONOMY,
    getTaxonomy,
    getAllKinds
};

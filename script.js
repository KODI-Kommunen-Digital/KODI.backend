const { getConnection } = require("./services/mysql");

const servicestoInsert = {
    "services": [
        {
            "service": "Bürgerservice",
            "link": null,
            "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/Buergerservices/Buergerservices.png",
            "serviceType": null,
            "children": [
                {
                    "service": "Online Dienste",
                    "link": "https://www.rottenburg.de/online+dienste.22.htm?Inav=3",
                    "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/Buergerservices/Sub-services/Online_Dienste.png",
                    "serviceType": 1,
                    "children": []
                },
                {
                    "service": "Virtuelles Bauamt (CIT)",
                    "link": null,
                    "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/Buergerservices/Sub-services/viertuelles_bauamt.png",
                    "serviceType": 3,
                    "children": [
                        {
                            "service": "Baugenehmigung beantragen",
                            "link": "https://www.rottenburg.de/baugenehmigung+beantragen.99454.htm?lnav=21",
                            "image": "https://coburg1heidi.obs.eu-de.otc.t-systems.com/admin/News/Defaultimage9.png",
                            "serviceType": 2,
                            "children": []
                        },
                        {
                            "service": "Baugebiete",
                            "link": "https://www.rottenburg.de/wohnbaugebiete.39803.htm?lnav=21",
                            "image": "https://coburg1heidi.obs.eu-de.otc.t-systems.com/admin/News/Defaultimage9.png",
                            "serviceType": 2,
                            "children": []
                        },
                        {
                            "service": "Baugemeinschaften",
                            "link": "https://www.rottenburg.de/baugemeinschaften.120065.htm?lnav=21",
                            "image": "https://coburg1heidi.obs.eu-de.otc.t-systems.com/admin/News/Defaultimage9.png",
                            "serviceType": 2,
                            "children": []
                        },
                        {
                            "service": "Baugenehmigung - Kenntnisvergabeverfahren beantragen",
                            "link": "https://www.rottenburg.de/bauvorhaben+im+kenntnisgabeverfahren+anzeigen.99456.htm?lnav=21",
                            "image": "https://coburg1heidi.obs.eu-de.otc.t-systems.com/admin/News/Defaultimage9.png",
                            "serviceType": 2,
                            "children": []
                        },
                        {
                            "service": "Baugenehmigung -Nutzungsänderungen einer baulichen Anlage beantragen",
                            "link": "https://www.rottenburg.de/baugenehmigung+nutzungsaenderung+einer+baulichen+anlage+beantragen.19374.htm?lnav=21",
                            "image": "https://coburg1heidi.obs.eu-de.otc.t-systems.com/admin/News/Defaultimage9.png",
                            "serviceType": 2,
                            "children": []
                        },
                        {
                            "service": "Baugenehmigung im Vereinfachten Verfahren beantragen",
                            "link": "https://www.rottenburg.de/baugenehmigung+im+vereinfachten+verfahren+beantragen.20070.htm?lnav=21",
                            "image": "https://coburg1heidi.obs.eu-de.otc.t-systems.com/admin/News/Defaultimage9.png",
                            "serviceType": 2,
                            "children": []
                        },
                        {
                            "service": "Baulastenverzeichnis",
                            "link": "https://www.rottenburg.de/baulastenverzeichnis+einsicht+nehmen.99453.htm?lnav=21",
                            "image": "https://coburg1heidi.obs.eu-de.otc.t-systems.com/admin/News/Defaultimage9.png",
                            "serviceType": 2,
                            "children": []
                        },
                        {
                            "service": "Baulückenbörse",
                            "link": "https://www.rottenburg.de/baulueckenboerse.40005.htm?lnav=21",
                            "image": "https://coburg1heidi.obs.eu-de.otc.t-systems.com/admin/News/Defaultimage9.png",
                            "serviceType": 2,
                            "children": []
                        },
                        {
                            "service": "Baumaßnahmen an Kulturdenkmalen",
                            "link": "https://www.rottenburg.de/denkmalschutz+denkmalrechtliche+genehmigung+beantragen.19498.htm?lnav=21",
                            "image": "https://coburg1heidi.obs.eu-de.otc.t-systems.com/admin/News/Defaultimage9.png",
                            "serviceType": 2,
                            "children": []
                        },
                        {
                            "service": "Bauplätze Kernstadt",
                            "link": "https://www.rottenburg.de/bauplaetze+kernstadt+.39778.htm?lnav=21",
                            "image": "https://coburg1heidi.obs.eu-de.otc.t-systems.com/admin/News/Defaultimage9.png",
                            "serviceType": 2,
                            "children": []
                        },
                        {
                            "service": "Bauplätze Stadtteile",
                            "link": "https://www.rottenburg.de/bauplaetze+stadtteile+.39775.htm?lnav=21",
                            "image": "https://coburg1heidi.obs.eu-de.otc.t-systems.com/admin/News/Defaultimage9.png",
                            "serviceType": 2,
                            "children": []
                        },
                        {
                            "service": "Bauüberwachung",
                            "link": "https://www.rottenburg.de/bauueberwachung.39026.htm?lnav=21",
                            "image": "https://coburg1heidi.obs.eu-de.otc.t-systems.com/admin/News/Defaultimage9.png",
                            "serviceType": 2,
                            "children": []
                        },
                        {
                            "service": "Bauunterhaltung von städtischen Gebäuden",
                            "link": "https://www.rottenburg.de/bauunterhaltung+von+staedtischen+gebaeuden.39923.htm?lnav=21",
                            "image": "https://coburg1heidi.obs.eu-de.otc.t-systems.com/admin/News/Defaultimage9.png",
                            "serviceType": 2,
                            "children": []
                        },
                        {
                            "service": "Bauvorbescheid beantragen",
                            "link": "https://www.rottenburg.de/bauvorbescheid+beantragen.99455.htm?lnav=21",
                            "image": "https://coburg1heidi.obs.eu-de.otc.t-systems.com/admin/News/Defaultimage9.png",
                            "serviceType": 2,
                            "children": []
                        },
                        {
                            "service": "Bebauungspläne",
                            "link": "https://www.rottenburg.de/bebauungsplaene.48817.htm?lnav=21",
                            "image": "https://coburg1heidi.obs.eu-de.otc.t-systems.com/admin/News/Defaultimage9.png",
                            "serviceType": 2,
                            "children": []
                        }
                    ]
                },
                {
                    "service": "Dienstlesitungen A-Z",
                    "link": null,
                    "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/Buergerservices/Sub-services/Dienstleistungen_A_Z.png",
                    "serviceType": null,
                    "children": []
                },
                {
                    "service": "Online-Terminbuchung",
                    "link": null,
                    "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/Buergerservices/Sub-services/Online_Terminbuchung.png",
                    "serviceType": 3,
                    "children": [
                        {
                            "service": "Bürgerbüro",
                            "link": "https://tempus-termine.com/termine/index.php?anlagennr=100&anwendung=1",
                            "image": "https://coburg1heidi.obs.eu-de.otc.t-systems.com/admin/News/Defaultimage9.png",
                            "serviceType": 2,
                            "children": []
                        },
                        {
                            "service": "Ausländeramt",
                            "link": "https://tempus-termine.com/termine/index.php?anlagennr=100&anwendung=9",
                            "image": "https://coburg1heidi.obs.eu-de.otc.t-systems.com/admin/News/Defaultimage9.png",
                            "serviceType": 2,
                            "children": []
                        },
                        {
                            "service": "Für Gewerbe- und Waffenangelegenheiten",
                            "link": "https://tempus-termine.com/termine/index.php?anlagennr=100&anwendung=4",
                            "image": "https://coburg1heidi.obs.eu-de.otc.t-systems.com/admin/News/Defaultimage9.png",
                            "serviceType": 2,
                            "children": []
                        },
                        {
                            "service": "Bürgerbüro für Soziales (Sozialangelegenheiten)",
                            "link": "https://tempus-termine.com/termine/index.php?anlagennr=100&anwendung=3",
                            "image": "https://coburg1heidi.obs.eu-de.otc.t-systems.com/admin/News/Defaultimage9.png",
                            "serviceType": 2,
                            "children": []
                        },
                        {
                            "service": "Bürgerbüro für Soziales (Rentenangelegenheiten)",
                            "link": "https://tempus-termine.com/termine/index.php?anlagennr=100&anwendung=2",
                            "image": "https://coburg1heidi.obs.eu-de.otc.t-systems.com/admin/News/Defaultimage9.png",
                            "serviceType": 2,
                            "children": []
                        }
                    ]
                },
                {
                    "service": "Kontakt & Öffnungszeiten",
                    "link": null,
                    "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/Buergerservices/Sub-services/Kontakt_und_Oeffnungszeiten.png",
                    "serviceType": null,
                    "children": []
                }
            ]
        },
        {
            "service": "Freizeit & Tourismus",
            "link": null,
            "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/Freizeit/Freizeit_und_Tourismus.png",
            "serviceType": null,
            "children": [
                {
                    "service": "Toubis",
                    "link": null,
                    "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/Freizeit/subservices/toubis.png",
                    "serviceType": null,
                    "children": []
                },
                {
                    "service": "Virtuelle Stadtführung",
                    "link": null,
                    "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/Freizeit/subservices/Virtuelle_Stadtfuehrung.png",
                    "serviceType": null,
                    "children": [
                        {
                            "service": "Zeig-mal-App",
                            "link": "https://qr.zeigmal.digital/D1maD",
                            "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/Freizeit/subservices/sub-subservices/Zeig-mal-App.png",
                            "serviceType": 1,
                            "children": []
                        },
                        {
                            "service": "Lauschtour-App",
                            "link": "http://www.app.lauschtour.de/",
                            "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/Freizeit/subservices/sub-subservices/lauschtour.png",
                            "serviceType": 1,
                            "children": []
                        }
                    ]
                },
                {
                    "service": "Bibliothekskatalog",
                    "link": "https://www.stadtbibliothek-rottenburg.de",
                    "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/Freizeit/subservices/Bibliothekskatalog.png",
                    "serviceType": 2,
                    "children": []
                },
                {
                    "service": "Online-Anmeldung für Leseausweise",
                    "link": "https://www.stadtbibliothek-rottenburg.de/",
                    "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/Freizeit/subservices/OnlineAnmeldung_Leseausweise.png",
                    "serviceType": 2,
                    "children": []
                },
                {
                    "service": "Tomas (Unterkunftsverzeichnis)",
                    "link": "https://tportal.tomas.travel/salb/ukv/result?tt=rc03bilus6avaq3q20nfi6re71",
                    "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/Freizeit/subservices/Tomas_Unterkunftsverzeichnis.png",
                    "serviceType": 2,
                    "children": []
                }
            ]
        },
        {
            "service": "Einkaufen & Gastronomie",
            "link": null,
            "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/Einkaufen/Einkaufen_und_Gastronomie.png",
            "serviceType": null,
            "children": [
                {
                    "service": "Rottenburger Geschenkcheck",
                    "link": null,
                    "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/Einkaufen/subservices/Rottenburger_Geschenkcheck.png",
                    "serviceType": null,
                    "children": [
                        {
                            "service": "Kauf",
                            "link": "https://geschenkscheck.wtg-rottenburg.de/shop/stadtgutscheine/rottenburger-geschenkscheck-download/",
                            "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/Einkaufen/subservices/sub-subservices/Kauf.png",
                            "serviceType": 2,
                            "children": []
                        },
                        {
                            "service": "Aufladen",
                            "link": "https://geschenkscheck.wtg-rottenburg.de/shop/stadtgutscheine/rottenburger-geschenkscheck-aufladung/",
                            "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/Einkaufen/subservices/sub-subservices/Aufladen.png",
                            "serviceType": 2,
                            "children": []
                        },
                        {
                            "service": "Guthabenabfrage",
                            "link": "https://geschenkscheck.wtg-rottenburg.de/gutschein/",
                            "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/Einkaufen/subservices/sub-subservices/Guthabenabfrage.png",
                            "serviceType": 2,
                            "children": []
                        }
                    ]
                },
                {
                    "service": "Wochenmärkte",
                    "link": null,
                    "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/Einkaufen/subservices/Wochenmarkte.png",
                    "serviceType": null,
                    "children": [
                        {
                            "service": "Zeit und Ort",
                            "link": null,
                            "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/Einkaufen/subservices/sub-subservices/Zeit und Ort.png",
                            "serviceType": null,
                            "children": []
                        },
                        {
                            "service": "Marktbeschicker",
                            "link": null,
                            "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/Einkaufen/subservices/sub-subservices/Marktbeschicker.png",
                            "serviceType": null,
                            "children": []
                        }
                    ]
                }
            ]
        },
        {
            "service": "Mobilität",
            "link": null,
            "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/Mobilitat/Mobilitaet.png",
            "serviceType": null,
            "children": [
                {
                    "service": "Parkster App",
                    "link": null,
                    "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/Mobilitat/subservices/Parkster_App.png",
                    "serviceType": null,
                    "children": []
                },
                {
                    "service": "Naldo App",
                    "link": null,
                    "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/Mobilitat/subservices/Naldo_App.png",
                    "serviceType": null,
                    "children": []
                }
            ]
        },
        {
            "service": "Städtische Mitteilungen",
            "link": "https://www.rottenburg.de/stadtplan.114874.htm",
            "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/Stadtische_Mitteilungen/Stadtische_Mitteilungen.png",
            "serviceType": null,
            "children": [
                {
                    "service": "RoMi Mitteilungen",
                    "link": null,
                    "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/Stadtische_Mitteilungen/subservices/RoMi_Mitteilungen.png",
                    "serviceType": null,
                    "children": []
                },
                {
                    "service": "Amtliche Bekanntmachungen",
                    "link": null,
                    "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/Stadtische_Mitteilungen/subservices/Amtliche_Bekanntmachungen.png",
                    "serviceType": null,
                    "children": []
                }
            ]
        },
        {
            "service": "Stellenangebote der Verwaltung",
            "link": null,
            "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/Stellenangebote/Stellenangebote.png",
            "serviceType": null,
            "children": []
        },
        {
            "service": "Städtische Gremien",
            "link": null,
            "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/Staedtische_Gremien/Staedtische_Gremien.png",
            "serviceType": null,
            "children": [
                {
                    "service": "Ratsinformationssystem",
                    "link": "https://rottenburg-sitzungsdienst.komm.one/bi/info.asp",
                    "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/Staedtische_Gremien/subservices/Ratsinformationssystem.png",
                    "serviceType": 1,
                    "children": []
                },
                {
                    "service": "Mitglieder und Sitzverteilung",
                    "link": null,
                    "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/Staedtische_Gremien/subservices/Mitglieder_und_Sitzverteilung.png",
                    "serviceType": null,
                    "children": []
                }
            ]
        },
        {
            "service": "Mängelmelder",
            "link": null,
            "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/Maengelmelder/Maengelmelder.png",
            "serviceType": null,
            "children": []
        },
        {
            "service": "Kind & Familie",
            "link": null,
            "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/Kind/Kind_und_Familie.png",
            "serviceType": null,
            "children": [
                {
                    "service": "Kita-App",
                    "link": null,
                    "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/Kind/subservices/Kita-App.png",
                    "serviceType": null,
                    "children": []
                },
                {
                    "service": "NH-Kitaportal",
                    "link": "https://elternportal.komm.one/rottenburg/#/eltern/suchen",
                    "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/Kind/subservices/NH-Kitaportal.png",
                    "serviceType": 2,
                    "children": []
                }
            ]
        },
        {
            "service": "Stadtplan Rottenburg",
            "link": "https://www.rottenburg.de/stadtplan.114874.htm",
            "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/citymap.png",
            "serviceType": 2,
            "children": []
        },
        {
            "service": "Village App",
            "link": null,
            "image": "https://rottenburg1heidi.obs.eu-de.otc.t-systems.com/eservices/village.png",
            "serviceType": 3,
            "children": [
                {
                    "service": "baisingen",
                    "link": "www.baisingen.app",
                    "image": "https://coburg1heidi.obs.eu-de.otc.t-systems.com/admin/News/Defaultimage9.png",
                    "serviceType": 2,
                    "children": []
                },
                {
                    "service": "bieringen",
                    "link": "www.bieringen.app",
                    "image": "https://coburg1heidi.obs.eu-de.otc.t-systems.com/admin/News/Defaultimage9.png",
                    "serviceType": 2,
                    "children": []
                },
                {
                    "service": "bettingen",
                    "link": "www.bettingen.app",
                    "image": "https://coburg1heidi.obs.eu-de.otc.t-systems.com/admin/News/Defaultimage9.png",
                    "serviceType": 2,
                    "children": []
                },
                {
                    "service": "eckenweiler",
                    "link": "www.eckenweiler.app",
                    "image": "https://coburg1heidi.obs.eu-de.otc.t-systems.com/admin/News/Defaultimage9.png",
                    "serviceType": 2,
                    "children": []
                },
                {
                    "service": "ergenzingen",
                    "link": "www.ergenzingen.app",
                    "image": "https://coburg1heidi.obs.eu-de.otc.t-systems.com/admin/News/Defaultimage9.png",
                    "serviceType": 2,
                    "children": []
                },
                {
                    "service": "hailfingen",
                    "link": "www.hailfingen.app",
                    "image": "https://coburg1heidi.obs.eu-de.otc.t-systems.com/admin/News/Defaultimage9.png",
                    "serviceType": 2,
                    "children": []
                },
                {
                    "service": "hemmendorf",
                    "link": "www.hemmendorf.app",
                    "image": "https://coburg1heidi.obs.eu-de.otc.t-systems.com/admin/News/Defaultimage9.png",
                    "serviceType": 2,
                    "children": []
                },
                {
                    "service": "kiebingen",
                    "link": "www.kiebingen.app",
                    "image": "https://coburg1heidi.obs.eu-de.otc.t-systems.com/admin/News/Defaultimage9.png",
                    "serviceType": 2,
                    "children": []
                },
                {
                    "service": "schwalldorf",
                    "link": "www.schwalldorf.app",
                    "image": "https://coburg1heidi.obs.eu-de.otc.t-systems.com/admin/News/Defaultimage9.png",
                    "serviceType": 2,
                    "children": []
                },
                {
                    "service": "seebronn",
                    "link": "www.seebronn.app",
                    "image": "https://coburg1heidi.obs.eu-de.otc.t-systems.com/admin/News/Defaultimage9.png",
                    "serviceType": 2,
                    "children": []
                },
                {
                    "service": "weiler",
                    "link": "www.weiler.app",
                    "image": "https://coburg1heidi.obs.eu-de.otc.t-systems.com/admin/News/Defaultimage9.png",
                    "serviceType": 2,
                    "children": []
                },
                {
                    "service": "wendelsheim",
                    "link": "www.wendelsheim.app",
                    "image": "https://coburg1heidi.obs.eu-de.otc.t-systems.com/admin/News/Defaultimage9.png",
                    "serviceType": 2,
                    "children": []
                },
                {
                    "service": "wurmlingen",
                    "link": "www.wurmlingen.app",
                    "image": "https://coburg1heidi.obs.eu-de.otc.t-systems.com/admin/News/Defaultimage9.png",
                    "serviceType": 2,
                    "children": []
                }
            ]
        }
    ]
}
const SERVICE_TYPE_MAP = {
    1: 'Deep Link',
    2: 'Link',
    3: 'Group Link'
};

async function insertServices(connection, services, parentId = null) {
    for (const service of services) {
        const { service: serviceName, link, image, serviceType, children } = service;
        const mappedType = serviceType ? SERVICE_TYPE_MAP[serviceType] : null;

        const [result] = await connection.execute(
            `INSERT INTO eservices (parentId, service, link, image, serviceType)
             VALUES (?, ?, ?, ?, ?)`,
            [parentId, serviceName, link, image, mappedType]
        );

        const insertedId = result.insertId;

        if (children && children.length > 0) {
            await insertServices(connection, children, insertedId);
        }
    }
}

// Main function
async function run() {
    const connection = await getConnection();
    try {
        const services = servicestoInsert.services;
        await insertServices(connection, services);
        console.log("✅ Services inserted successfully.");
    } catch (err) {
        console.error("❌ Error inserting services:", err);
    } finally {
        connection.release(); // don't forget to release the connection
    }
}

run().then(() => console.log('this is done')).catch(err => console.error(err))
/* ---------- BIT & BUGS, modo ritmo: el nivel DOOM CROSSING (sonidos/doom_crossing.mp3) ----------
   Dos mundos que se turnan con la canción: un pueblito tierno y un infierno metalero.
   En el pueblo cada bug atrapado da campanas; al entrar al infierno, las campanas se cobran como armadura.
   Estos datos salen de analizar el audio: si cambias el mp3 por otra versión, los bugs ya no caerán a tiempo.
   - sec: cada escenario [empieza (s), termina (s), cuánto tarda en caer un bug (s), BPM, nombre ES, nombre EN]
   - notas: de tres en tres [milisegundo en que BIT lo atrapa, posición horizontal 0-100, 1 si es dorado]
   - energia: qué tan fuerte va la canción, dos valores por segundo (0-9)
   - golpes: centésimas de segundo de cada tiempo; el escenario late con ellos */
window.RitmoDoom = {
  id: "doom",
  tema: "doom",
  archivo: "sonidos/doom_crossing.mp3",
  // Lo que se ve en los créditos (la ventana AUDIO.EXE) y en el selector. Revisa que el artista y el enlace sean los correctos
  titulo: "DOOM CROSSING",
  corto: "DOOM_CROSSING",
  artista: "THE CHALKEATERS",
  enlace: "",
  // Qué tramo es el jefe y cuál el vuelo; en cuáles no sale fiebre (calma), cuáles laten fuerte, cuáles crecen y en cuáles la cámara pasea
  jefe: 7,
  vuelo: 8,
  calma: [0, 5, 10],
  fuerte: [2, 4, 7, 9],
  sube: [6],
  tranquila: [5, 10],
  // El mundo de cada tramo: p = pueblo, i = infierno, x = los dos a la vez
  mundos: "ppipippiixp",
  pistas: [
    ["Bienvenida al pueblo. Pocos bugs: cada uno ya te da campanas.", "Welcome to town. Few bugs: each one already gives you bells."],
    ["El pueblo: junta campanas, 12 valen un escudo para el infierno.", "The town: collect bells, 12 are worth one shield for hell."],
    ["Primer infierno: más rápido. Tus escudos aguantan un golpe cada uno.", "First hell: faster. Each shield takes one hit for you."],
    ["De vuelta al pueblo. Recarga campanas antes de la matanza.", "Back in town. Restock bells before the rampage."],
    ["El infierno aprieta: bombas, polillas y acorazados.", "Hell tightens: bombs, moths and armored bugs."],
    ["Noche tranquila. Sin fiebre; fantasmas y nidos.", "Quiet night. No fever; ghosts and nests."],
    ["El cielo se pone rojo. Última oportunidad de juntar campanas.", "The sky turns red. Last chance to collect bells."],
    ["El demonio lanza columnas de fuego a tu carril. Sal antes del golpe.", "The demon throws fire columns at your lane. Leave before the beat."],
    ["BIT vuela sobre el infierno: bugs de lado y franjas de fuego.", "BIT flies over hell: sideways bugs and fire strips."],
    ["Los dos mundos a la vez. Lo más rápido del nivel.", "Both worlds at once. The fastest part of the level."],
    ["Atardecer en el pueblo. Los últimos bugs.", "Sunset in town. The last bugs."],
  ],
  volumen: 0.85,
  // Si los bugs llegan antes o después que la música, ajusta aquí (en segundos; positivo = llegan antes)
  desfase: 0,
  dur: 150.5,
  sec: [[0,12.19,1.7,108,"BIENVENIDA","WELCOME"],[12.19,25.47,1.3,108,"PUEBLITO","LITTLE TOWN"],[25.47,38.75,1.1,108,"PUERTAS DEL INFIERNO","GATES OF HELL"],[38.75,47.61,1.3,108,"DIA DE COMPRAS","SHOPPING DAY"],[47.61,62.0,1.05,108,"MATANZA","RAMPAGE"],[62.0,74.17,1.5,108,"NOCHE DE PESCA","NIGHT FISHING"],[74.17,86.35,1.2,108,"SE NUBLA","CLOUDS GATHER"],[86.35,98.52,1.05,108,"JEFE DEMONIO.EXE","BOSS DEMON.EXE"],[98.52,121.77,1.0,108,"CIELO ROJO","RED SKY"],[121.77,136.16,1.0,108,"DOS MUNDOS","TWO WORLDS"],[136.16,150.5,1.6,108,"ATARDECER","SUNSET"]],
  notas: [2502,82,0,5270,84,0,5546,68,0,7207,52,1,8867,31,0,13018,48,0,13295,21,1,13571,56,0,15232,50,0,16338,69,0,16892,64,0,17445,19,0,17722,14,0,17999,49,0,19382,25,0,19936,38,0,20489,74,0,21043,27,0,21596,45,0,22703,18,0,23533,71,0,23810,53,0,24087,80,0,24640,63,0,24917,24,1,25747,93,0,26024,84,0,26577,66,0,26854,41,0,27961,89,0,28237,48,0,28791,51,0,29344,89,0,30451,26,0,30728,40,0,31005,30,0,31835,40,0,32112,55,0,33218,33,1,33772,29,0,34049,92,0,34325,12,0,34602,25,0,34879,93,0,35155,67,0,35432,65,0,35709,37,0,35986,18,0,36262,76,0,36539,10,0,38476,29,0,39860,53,0,40413,22,0,40690,36,0,40967,41,1,41520,37,0,42073,72,0,43180,91,0,43734,62,0,44287,42,0,44841,26,0,45948,68,0,46501,66,0,47054,55,0,47885,9,0,48438,36,0,48715,59,0,48991,63,0,49545,59,0,49822,45,0,50098,85,0,50375,58,0,50652,83,0,50929,80,0,51205,34,0,51482,70,0,52035,24,0,52312,41,0,52589,79,0,52866,48,0,53142,22,1,53696,42,0,54249,79,0,54803,68,0,55356,28,0,55909,48,0,56463,61,0,56740,64,0,57570,19,0,57847,47,0,58400,87,0,59507,94,0,60614,36,0,61167,79,0,61721,84,0,62828,47,0,63934,67,0,64765,91,0,65871,73,0,66425,17,0,66978,50,0,67532,52,1,68639,33,0,69192,18,0,70022,14,0,70299,75,0,71129,72,0,72236,89,0,74173,28,0,74450,38,0,75003,79,0,75280,65,0,75557,27,0,75833,11,0,76387,67,0,77217,20,0,77494,19,1,78047,56,0,79154,84,0,79984,45,0,80538,22,0,80814,11,0,81091,65,0,83858,44,0,84412,67,0,84965,52,0,85519,65,1,85795,6,0,86349,18,0,87179,60,0,87456,73,0,88009,74,0,88286,24,0,88563,64,1,89116,59,0,90223,88,0,90776,49,0,91330,24,0,91606,34,0,91883,68,0,92160,7,0,92437,60,0,92713,62,0,92990,86,0,93267,24,0,93820,77,0,94374,35,0,95204,67,0,95481,13,0,96034,48,0,96587,8,0,97418,54,0,97694,63,0,97971,36,0,99078,93,0,99631,12,0,100185,72,0,100738,74,1,101292,25,0,101845,71,0,102399,30,0,102952,53,0,103505,52,0,103782,78,0,104059,95,0,104336,27,0,105996,87,0,106549,7,0,107103,54,0,107933,11,0,108210,94,0,108486,88,0,109040,63,1,109317,24,0,109593,66,0,110147,44,0,110423,39,0,110700,57,0,111254,12,0,111807,26,0,112360,63,0,112914,29,0,113467,74,0,114021,80,0,114574,37,0,114851,28,0,115128,55,1,115681,50,0,115958,10,0,116511,50,0,117618,51,0,117895,13,0,118725,5,0,119278,41,0,119555,45,0,119832,87,0,120109,48,0,121492,21,0,121769,86,1,122046,81,0,122322,89,0,122876,85,0,123429,39,0,123983,68,0,124536,66,0,125090,57,0,125366,59,0,125643,68,0,125920,48,1,126196,54,0,126473,49,0,126750,86,0,127027,76,0,127303,55,0,127580,31,0,128134,10,0,128410,90,0,128687,25,0,129240,74,0,129794,62,0,130347,88,0,130624,14,0,130901,71,0,131177,61,0,131454,38,0,132838,20,0,133391,45,0,134498,87,0,134775,47,0,135052,84,0,135605,95,0,140032,85,1,141416,28,0,141693,23,0,141970,75,0,143353,24,0,145290,68,0,145567,87,0,147227,36,0,147781,56,0],
  energia: "0032234144243334333434459766556655656556667565654276667776678976776788888877766777676776666667688843488888767777788789867677766657567557567666667655566667667667556777766744287878878878786888888877766677666766666666766777766777676776666667666653476777766667777775667788877865665555544444433333343433232211",
  golpes: [112,223,333,444,555,665,776,887,997,1108,1219,1274,1329,1385,1440,1495,1551,1606,1662,1717,1772,1828,1883,1938,1994,2049,2104,2160,2215,2270,2326,2381,2436,2492,2547,2602,2658,2713,2768,2824,2879,2934,2990,3045,3100,3156,3211,3266,3322,3377,3433,3488,3543,3599,3654,3709,3765,3820,3875,3931,3986,4041,4097,4152,4207,4263,4318,4373,4429,4484,4539,4595,4650,4705,4761,4816,4871,4927,4982,5038,5093,5148,5204,5259,5314,5370,5425,5480,5536,5591,5646,5702,5757,5812,5868,5923,5978,6034,6089,6144,6200,6310,6421,6532,6642,6753,6864,6975,7085,7196,7307,7417,7473,7528,7583,7639,7694,7749,7805,7860,7915,7971,8026,8081,8137,8192,8247,8303,8358,8413,8469,8524,8580,8635,8690,8746,8801,8856,8912,8967,9022,9078,9133,9188,9244,9299,9354,9410,9465,9520,9576,9631,9686,9742,9797,9852,9908,9963,10018,10074,10129,10185,10240,10295,10351,10406,10461,10517,10572,10627,10683,10738,10793,10849,10904,10959,11015,11070,11125,11181,11236,11291,11347,11402,11457,11513,11568,11623,11679,11734,11789,11845,11900,11956,12011,12066,12122,12177,12232,12288,12343,12398,12454,12509,12564,12620,12675,12730,12786,12841,12896,12952,13007,13062,13118,13173,13228,13284,13339,13394,13450,13505,13560,13616,13727,13837,13948,14059,14169,14280,14391,14501,14612,14723,14833,14944],
};
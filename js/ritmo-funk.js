/* ---------- BIT & BUGS, modo ritmo: el nivel FUTURE FUNK (sonidos/future_funk.mp3) ----------
   Atardeceres de neón, palmeras, autopista y pista de baile.
   La regla del nivel es el GROOVE: cada salto de BIT que cae justo en el golpe de la música lo sube, y con el groove
   arriba cada bug vale más (hasta el doble). Si dejas de bailar, se va apagando solo.
   Estos datos salen de analizar el audio: si cambias el mp3 por otra versión, los bugs ya no caerán a tiempo.
   - sec: cada escenario [empieza (s), termina (s), cuánto tarda en caer un bug (s), BPM, nombre ES, nombre EN]
   - notas: de tres en tres [milisegundo en que BIT lo atrapa, posición horizontal 0-100, 1 si es dorado]
   - energia: qué tan fuerte va la canción, dos valores por segundo (0-9)
   - golpes: centésimas de segundo de cada tiempo; el escenario late con ellos y de aquí sale el groove */
window.RitmoFunk = {
  id: "funk",
  tema: "funk",
  archivo: "sonidos/future_funk.mp3",
  // Lo que se ve en los créditos (la ventana AUDIO.EXE) y en el selector. Pon aquí al artista y su enlace
  titulo: "FUTURE FUNK",
  corto: "FUTURE_FUNK",
  artista: "",
  enlace: "",
  // Qué tramo es el jefe y cuál el vuelo; en cuáles no sale fiebre (calma), cuáles laten fuerte, cuáles crecen y en cuáles la cámara pasea
  // El tramo lateral: la terminal se va a la izquierda, BIT se mueve de arriba abajo y los bugs le llegan de lado
  lateral: 4,
  // Al final de este tramo (la primera ciudad) todo se encoge dentro de un recuadro que se lo lleva
  caja: 2,
  // Tramos que terminan en un destello que lo ciega todo: [tramo, segundos que tarda en subir]
  destellos: [[0, 2], [3, 3], [6, 0.6]],
  /* Cambios de fila forzados al final del tramo lateral (el arcade). AQUI SE AJUSTAN A MANO:
       teles: [segundo en que empiezan, [[cada cuántos segundos, cuántas veces], [..., ...], ...]]
     Ahora: empiezan en el segundo 86 (1:26); 4 veces cada 0.45 s, luego 4 cada 0.25 s y luego 8 cada 0.15 s.
     Con cada cambio la situación se vuelve otra cosa (BIT convertido en bug, fuera de la terminal, gigante, todo de
     cabeza...). El orden de esas rarezas está en js/juego.js, en la lista RAROS. */
  teles: [86, [[0.45, 4], [0.25, 4], [0.15, 8]]],
  /* Los flashazos que siguen al último cambio de fila. AQUI SE AJUSTAN A MANO: cada número es un flashazo, en segundos
     contados desde el último cambio de fila. Con cada uno cambia el escenario del fondo, y el tramo siguiente (la fábrica)
     empieza casi medio segundo después del último. Puedes cambiar los tiempos y agregar o quitar flashazos.
     Ahora: uno al terminar · un segundo y medio después, dos seguidos · dos segundos después, seis a tiempos distintos */
  flashazos: [0.25, 0.5, 0.5, 3.9, 1.15, 2.5, 2.7, 2.2, 2.5, 2.9],
  /* La fábrica. pisones = en qué tramos caen pisones sobre las casillas (hay que salirse de la amarilla).
     aplastada = la escena en que los pisones aplastan a BIT sin quitarle vidas: [segundo en que cae el primero, cada
     cuántos segundos cae el siguiente]. Caen en las casillas 1, 5, 2, 4 y 3 (la de BIT). AQUI SE AJUSTA A MANO.
     En el instante en que cae el último va el flashazo y empieza la fábrica en llamas: ese corte se calcula solo,
     no hace falta mover sec. */
  pisones: [5, 6],
  aplastada: [108.5, 0.35],
  /* El triple: cada tantos pisones, uno pega, vuelve a pegar al instante en la misma casilla y enseguida cae otro en la
     casilla de la izquierda o de la derecha. AQUI SE AJUSTA A MANO: [cada cuántos pisones, segundos entre golpe y golpe].
     Ahora: uno de cada 2, con un cuarto de segundo entre golpes (media nota a 120 BPM). Con [1, 0.25] todos son triples;
     borra la línea para quitarlos. */
  combo: [2, 0.25],
  /* Al acabar el jefe: [tramo que termina, segundos] de blanco con chispas antes de que se vea el escenario siguiente.
     Empieza en el instante en que BIT atrapa el último bug del jefe (cae por en medio); si se le va, al acabar el tramo.
     Mientras dura no hay bugs ni rayos, y a BIT no se le ve hasta que el blanco empieza a apagarse. */
  chispas: [7, 8],
  /* La luna, en segundos contados desde que empieza ese tramo: [cuándo se prenden las estrellas, cuándo empieza a
     romperse todo, cuántas veces por segundo se rompe]. Se sigue rompiendo hasta que acaba el tramo. */
  luna: [8, 24, 2],
  /* La casetera en reversa: cada par es [segundos que corre la cinta, segundos que se queda trabada]. La lista entera
     se repite hasta que acaba el tramo; ahora dura 6 s y el tramo 16 s, así que cabe casi 3 veces.
     Mientras está trabada, los bugs que vienen lejos brincan un cuadro atrás o adelante (caseteTramo dice en qué tramo).
     espera 1 y traba · espera 1 y traba · 2 trabas · medio segundo · 2 trabas · 1 traba larga */
  caseteTramo: 10,
  casete: [[1, 0.5], [1, 0.5], [0.125, 0.25], [0.125, 0.25], [0.5, 0.25], [0.125, 0.25], [0.125, 1]],
  // Tramos que empiezan de golpe: sin destello y sin que la cámara se acomode poco a poco
  sinDestello: [10],
  // Fogonazos blancos sueltos: [tramo, segundo contado desde que empieza ese tramo]. Ahora: al prenderse las estrellas
  // de la luna y al empezar a romperse los planetas (ponlos igual que los dos primeros números de 'luna')
  blancos: [[9, 8], [9, 24]],
  // El apagón del final: [tramo, segundos]. En los últimos segundos del tramo se apagan las luces hasta quedar a oscuras
  apagon: [13, 7],
  // El pasillo de puertas (uno de los mundos del multiverso): cada cuántos segundos se cruza una puerta
  puertas: 3,
  /* Las trabas: momentos en que la canción se traba, tartamudea o da un tirón hacia atrás. En cada una, un pisón avisa
     como siempre pero se queda trabado a medio caer y azota tarde. AQUI SE AJUSTAN A MANO:
       [segundo en que la canción se traba, cuántos segundos dura la traba]
     Estos salieron de analizar el audio (repeticiones muy cortas y huecos de volumen), no de oírlo: corrígelos a oído. */
  trabas: [[96.37, 0.4], [100.88, 0.4], [105.44, 0.35], [113.1, 0.9], [117.83, 0.5], [125.83, 0.45], [133.3, 0.75]],
  jefe: 7,
  vuelo: 8,
  // En el vuelo, los bugs caen desde arriba en vez de cruzar de lado (quita la línea para que crucen de lado)
  vueloVertical: true,
  // Vuelo libre: desde el destello del jefe y durante todo el vuelo no hay terminal y BIT se mueve por la pantalla entera
  // (quita la línea para que el vuelo vuelva a ser dentro de la terminal)
  vueloLibre: true,
  calma: [0, 5, 9],
  fuerte: [2, 6, 7, 11, 13],
  sube: [1, 12],
  tranquila: [5, 9],
  pistas: [
    ["El ascenso hacia la luna. Pocos bugs: prueba a saltar justo con el golpe.", "The climb to the moon. Few bugs: try hopping right on the beat."],
    ["Sale el sol: sube el groove saltando al compás, cada bug vale más.", "The sun comes up: build groove by hopping on the beat, every bug is worth more."],
    ["La autopista: el primer estribillo, rápido y seguido.", "The highway: the first chorus, fast and steady."],
    ["Subiendo el rascacielos en plena fiesta. Gemelos, troyanos y polillas; acaba en un destello.", "Climbing the skyscraper mid-party. Twins, trojans and moths; it ends in a flash."],
    ["El arcade, de lado: BIT sube y baja y los bugs llegan por la derecha. Al final todo se vuelve raro y acaba en flashazos.", "The arcade, sideways: BIT moves up and down, bugs come from the right. At the end it all gets weird and ends in flashes."],
    ["La fábrica abandonada: sal de la casilla amarilla antes de que caiga el pisón. Acaba mal para BIT.", "The abandoned factory: leave the yellow cell before the press drops. It ends badly for BIT."],
    ["La fábrica arde: donde cae un pisón la casilla se queda quemando. No te quedes parado encima.", "The factory burns: where a press lands the cell stays on fire. Do not stay standing on it."],
    ["El DJ improvisa con sus reflectores: tijera, barrido, ecualizador, estrobo y abanico. Sal de las franjas antes del golpe.", "The DJ improvises with his spotlights: scissors, sweep, equalizer, strobe and fan. Leave the strips before the beat."],
    ["BIT sube entre los planetas: los asteroides caen desde arriba, y hay franjas de luz.", "BIT climbs among the planets: asteroids fall from above, and there are light strips."],
    ["La luna: tranquilo, para recuperar vidas. Al final todo se empieza a romper.", "The moon: calm, to win lives back. At the end it all starts to break."],
    ["El casete y su cinta llena de recuerdos: va en reversa y se traba, y los bugs brincan con ella.", "The cassette and its tape full of memories: it runs in reverse and jams, and the bugs skip with it."],
    ["De vuelta en la ciudad, ahora de brillantina. Pasa rápido.", "Back in the city, now all glitter. It goes by fast."],
    ["Caminando sobre el anillo de un planeta: llueven asteroides.", "Walking on a planet's ring: it rains asteroids."],
    ["El multiverso: un túnel con ventanas a otros mundos. El final, lo más rápido del nivel; al final se apagan las luces.", "The multiverse: a tunnel with windows to other worlds. The ending, the fastest part of the level; at the end the lights go out."],
  ],
  volumen: 0.7,
  // Si los bugs llegan antes o después que la música, ajusta aquí (en segundos; positivo = llegan antes)
  desfase: 0,
  dur: 258.5,
  sec: [[0,16.06,1.7,120,"ASCENSO","ASCENT"],[16.06,24.04,1.35,120,"SALE EL SOL","SUNRISE"],[24.04,53.96,1.1,120,"AUTOPISTA","HIGHWAY"],[53.96,70.92,1.15,120,"EL RASCACIELOS","THE SKYSCRAPER"],[70.92,91.87,1.1,120,"ARCADE","ARCADE"],[91.87,110.9,1.4,120,"LA FABRICA","THE FACTORY"],[110.9,141.74,1.15,120,"FABRICA EN LLAMAS","FACTORY ON FIRE"],[141.74,153.68,1.05,120,"JEFE DJ.EXE","BOSS DJ.EXE"],[153.68,165.68,1.0,120,"ENTRE PLANETAS","AMONG PLANETS"],[165.68,197.68,1.4,120,"LA LUNA","THE MOON"],[197.68,213.68,1.2,120,"LA CASETERA","THE TAPE DECK"],[213.68,222.68,1.0,120,"CIUDAD DE BRILLANTINA","GLITTER CITY"],[222.68,236.68,1.1,120,"EL CINTURON","THE BELT"],[236.68,258.5,1.0,120,"MULTIVERSO","MULTIVERSE"]],
  notas: [6089,18,0,7087,45,0,8084,83,0,8583,85,0,10079,23,0,10578,53,0,11825,42,0,12074,12,1,16562,9,0,17560,7,0,18059,69,0,18557,27,0,19056,28,0,19555,92,0,20053,14,1,20552,85,0,21051,44,0,21550,21,0,22048,76,0,24043,21,1,24292,31,0,24542,72,0,25041,75,0,25290,20,0,25539,79,0,26287,55,0,27035,67,0,27285,92,0,27534,65,0,28282,19,0,28532,92,0,29030,63,0,29280,41,0,29529,44,0,29778,61,0,30277,73,0,30526,82,0,31275,90,0,32023,48,0,32272,52,0,33269,53,1,34017,63,0,34267,42,0,35015,50,0,35264,54,0,36262,76,0,37259,37,0,38007,8,0,38257,12,1,39254,59,0,40251,42,0,40501,45,0,40999,28,0,41249,8,0,41498,50,0,41997,70,0,42246,63,0,42496,93,0,43244,63,1,44241,70,0,44989,11,0,45239,66,0,45987,16,0,46236,51,0,46485,42,0,46984,87,0,47233,33,0,47982,28,0,48231,32,0,48480,51,0,48979,49,0,49228,7,0,49976,10,0,50226,91,0,50475,28,0,50974,45,0,51223,60,0,52221,33,1,53467,38,0,54215,73,0,54714,42,0,55213,35,0,56210,51,0,56460,67,0,56709,38,0,56958,91,0,57208,93,0,57706,41,0,58205,94,0,58455,65,0,58953,40,1,59203,86,0,59452,34,0,61198,30,0,61696,42,0,61946,21,0,62195,63,0,62444,58,0,63192,92,0,63442,43,0,64190,8,0,64938,13,1,65686,57,0,65935,10,0,66185,83,0,66933,52,0,67431,19,0,67930,35,0,68180,15,0,69426,57,0,70174,91,0,71421,60,0,71920,94,0,72419,29,0,72917,11,0,73416,30,0,73915,15,1,74414,37,0,74912,23,0,75910,33,0,76408,31,0,76907,57,0,77156,35,0,77406,41,0,77905,82,0,78403,73,0,78902,65,0,79401,7,1,79899,44,0,80398,51,0,80647,27,0,80897,43,0,81146,59,0,81645,46,0,81894,38,0,83141,24,0,83390,30,0,83640,58,0,83889,58,0,84138,20,0,84388,17,0,84637,30,0,85136,51,0,85385,23,0,85635,88,0,85884,88,0,89874,40,0,90622,82,0,90871,21,1,92118,55,0,92367,43,0,92617,35,0,92866,79,0,95609,12,0,96357,77,0,96606,49,0,96856,25,0,97354,45,1,97604,77,0,97853,63,0,99100,35,0,99349,48,0,99599,64,0,100596,70,0,100845,52,0,101344,16,0,101594,8,0,101843,71,0,105334,45,1,105583,86,0,107578,20,0,107828,75,0,108077,11,0,108326,29,0,108825,88,0,114061,78,0,114560,6,0,115807,48,0,116056,69,0,116306,40,0,116555,43,0,116804,82,0,117054,95,0,117303,27,1,117552,47,0,117802,60,0,118051,30,0,118301,47,0,118550,29,0,119049,22,0,119547,52,0,120046,78,0,120545,20,0,120794,29,0,121044,92,0,121293,54,0,121542,55,0,122540,79,0,123288,59,0,123537,66,0,124535,66,0,125283,36,0,125532,26,0,125781,77,0,126031,28,0,126529,17,0,127028,76,0,127277,93,0,127527,68,0,128275,40,0,128524,36,0,129522,93,0,130270,93,0,130519,61,0,131267,61,0,131517,11,1,132015,83,0,132514,61,0,133013,41,0,134259,40,0,135008,36,0,135257,16,0,136254,11,0,136504,56,0,138249,27,0,139247,50,0,140244,6,0,141990,25,0,142239,73,0,143236,25,0,143735,12,0,144234,35,0,144733,47,0,145231,9,0,145730,88,0,146229,83,0,146727,65,0,147226,36,0,147725,27,0,148224,6,0,148722,61,0,149221,14,0,149720,49,0,149969,31,0,150218,41,0,151216,32,0,153211,89,1,153709,7,0,154208,38,0,155206,80,0,155704,36,0,155954,52,0,156702,37,0,156951,9,0,157200,10,0,157699,6,0,157949,50,0,158447,29,1,158697,20,0,159195,54,0,159445,95,0,159694,66,0,159943,33,0,160442,84,0,160691,10,0,161190,12,0,161440,73,0,161689,35,0,162188,91,0,162936,59,0,163185,12,0,164182,44,0,165180,90,0,165679,56,0,165928,12,0,166177,65,0,167175,7,0,168172,58,0,168422,50,0,168671,6,0,169170,88,0,169419,26,0,169668,77,0,170167,66,0,170416,34,0,170666,56,0,170915,40,0,171165,11,0,176650,53,0,177648,82,0,177897,55,0,178645,11,0,179643,31,0,180640,83,0,181638,29,0,183632,45,0,184630,53,0,184879,51,0,185627,76,1,186625,46,0,187622,77,0,188620,45,0,190614,69,0,191113,22,0,191612,35,0,192111,14,0,192609,34,0,193108,7,0,193357,51,0,193607,53,1,193856,39,0,194105,79,0,194604,17,0,195103,29,0,195602,54,0,196100,94,0,196599,9,0,197098,11,0,197597,67,0,198095,34,0,199093,31,1,200090,8,1,201088,46,0,202085,50,0,203082,63,0,204080,91,0,206075,85,1,206823,85,0,207072,22,0,207820,47,0,208070,41,0,208568,69,0,209067,78,0,209815,59,0,210064,71,0,210813,5,0,211062,82,0,211311,32,0,211810,79,0,212059,23,0,212309,67,0,212558,68,0,213057,63,0,213306,81,0,213555,68,0,214553,33,0,215052,50,0,215550,59,0,216049,36,0,216548,82,0,217046,65,0,217296,68,0,217545,75,0,217795,52,0,218044,41,0,218543,15,0,218792,28,0,219041,19,0,219540,77,0,219789,77,0,220288,53,0,220537,33,0,220787,24,0,221535,23,0,221784,74,0,222034,48,0,223530,91,0,224278,77,0,224527,92,0,225525,35,1,226273,21,0,226522,36,0,227021,89,0,227520,93,0,228517,28,0,229016,45,0,229265,71,0,229514,94,0,230262,45,0,231011,83,0,231260,30,0,231509,12,0,232257,85,0,232507,92,0,233005,23,0,233255,83,0,233504,94,1,234252,8,0,234502,35,0,235000,83,0,235250,37,0,235499,85,0,236247,33,0,236496,30,0,236746,91,0,237244,61,0,237494,66,0,238242,35,0,238491,7,0,238741,7,0,238990,5,0,239239,51,0,239489,84,0,240237,25,0,241234,74,0,241484,6,0,242232,26,0,242481,18,0,243229,50,0,243478,27,0,243977,14,0,244227,93,0,244476,95,0,244975,44,0,245224,13,0,245473,18,0,246221,8,0,246720,23,0,246969,53,0,247468,18,0,248216,22,1,248466,55,0,249214,80,0,249463,24,0,249962,25,0,250211,22,0,250460,88,0,250959,60,0,251209,90,0,251458,67,0,252206,19,0,252455,5,0,253453,81,0],
  energia: "3445555555454544444555435555554566466545666666667887777788888888777777777777777777778887777777777777888776777777777766767777766667677777776777776766777778777767777787777787777777656432565666666666666666676666666666666688777667656777666766677767767666667676666777666677667667777666666777776677777777777777777877777778787777787777777777777777766656657777667777777777777776777777777544444444444444547474747674746776657566767575667575566666566667778777886777788877777878877777777777778777777787777788877787888887766555444411",
  golpes: [110,210,310,409,509,609,709,808,858,908,958,1008,1058,1108,1158,1207,1257,1307,1357,1407,1457,1507,1556,1606,1656,1706,1756,1806,1856,1906,1955,2005,2055,2105,2155,2205,2255,2305,2354,2404,2454,2504,2554,2604,2654,2704,2753,2803,2853,2903,2953,3003,3053,3103,3152,3202,3252,3302,3352,3402,3452,3501,3551,3601,3651,3701,3751,3801,3851,3900,3950,4000,4050,4100,4150,4200,4250,4299,4349,4399,4449,4499,4549,4599,4649,4698,4748,4798,4848,4898,4948,4998,5048,5097,5147,5197,5247,5297,5347,5397,5446,5496,5546,5596,5646,5696,5746,5796,5845,5895,5945,5995,6045,6095,6145,6195,6244,6294,6344,6394,6444,6494,6544,6594,6643,6693,6743,6793,6843,6893,6943,6993,7042,7092,7142,7192,7242,7292,7342,7391,7441,7491,7541,7591,7641,7691,7741,7790,7840,7890,7940,7990,8040,8090,8140,8189,8239,8289,8339,8389,8439,8489,8539,8588,8638,8688,8738,8788,8838,8888,8938,8987,9037,9087,9137,9187,9237,9287,9336,9386,9436,9486,9536,9586,9636,9686,9735,9785,9835,9885,9935,9985,10035,10085,10134,10184,10234,10284,10334,10384,10434,10484,10533,10583,10633,10683,10733,10783,10833,10882,10932,10982,11032,11082,11132,11182,11232,11281,11331,11381,11431,11481,11531,11581,11631,11680,11730,11780,11830,11880,11930,11980,12030,12079,12129,12179,12229,12279,12329,12379,12429,12478,12528,12578,12628,12678,12728,12778,12827,12877,12927,12977,13027,13077,13127,13177,13226,13276,13326,13376,13426,13476,13526,13576,13625,13675,13725,13775,13825,13875,13925,13975,14024,14074,14124,14174,14224,14274,14324,14374,14423,14473,14523,14573,14623,14673,14723,14772,14822,14872,14922,14972,15022,15072,15122,15171,15221,15271,15321,15371,15421,15471,15521,15570,15620,15670,15720,15770,15820,15870,15920,15969,16019,16069,16119,16169,16219,16269,16319,16368,16418,16468,16518,16568,16618,16668,16717,16767,16817,16867,16917,16967,17017,17067,17116,17166,17216,17266,17316,17366,17416,17466,17515,17565,17615,17665,17715,17765,17815,17865,17914,17964,18014,18064,18114,18164,18214,18264,18313,18363,18413,18463,18513,18563,18613,18662,18712,18762,18812,18862,18912,18962,19012,19061,19111,19161,19211,19261,19311,19361,19411,19460,19510,19560,19610,19660,19710,19760,19810,19859,19909,19959,20009,20059,20109,20159,20208,20258,20308,20358,20408,20458,20508,20558,20607,20657,20707,20757,20807,20857,20907,20957,21006,21056,21106,21156,21206,21256,21306,21356,21405,21455,21505,21555,21605,21655,21705,21755,21804,21854,21904,21954,22004,22054,22104,22153,22203,22253,22303,22353,22403,22453,22503,22552,22602,22652,22702,22752,22802,22852,22902,22951,23001,23051,23101,23151,23201,23251,23301,23350,23400,23450,23500,23550,23600,23650,23700,23749,23799,23849,23899,23949,23999,24049,24098,24148,24198,24248,24298,24348,24398,24448,24497,24547,24597,24647,24697,24747,24797,24847,24896,24946,24996,25046,25096,25146,25196,25246,25295,25345,25395,25445,25495,25545,25595,25645,25694,25744,25794,25844],
};
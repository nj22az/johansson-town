// Generated from data/studio/products.json by tools/studio/build-data.mjs. Do not edit it: change a product in Johansson
// Studio or with the johansson-studio tools (avatar-creator/docs/STUDIO-MCP.md). CI refuses a copy that does not match the data.
const freeze=value=>{if(value&&typeof value==='object'){for(const v of Object.values(value))freeze(v);Object.freeze(value);}return value;};
/** The sha256 of the products, prints and retired lines (their canonical JSON). */
export const FINGERPRINT='5d63789e46f47a0f469ba646c9dfa1c95f11746366f857284eef9cb478f8e0fc';
/** Sakura Shōten's products, in the order Thuan walks the floor (data/studio/products.json says what every field is). */
export const PRODUCTS=freeze([
 {
  "id": "tea",
  "inventoryName": "Green tea",
  "shop": "sakura",
  "name": "Green tea",
  "jp": "Green tea",
  "price": 120,
  "text": "NAGI · Nagi\nA chilled bottle of green tea. Thuan keeps the oldest stock at the front.",
  "bagColour": "#64835b",
  "mailOrder": true,
  "brand": {
   "name": "NAGI",
   "jp": "Nagi",
   "line": "Green tea",
   "paper": "#f5edcf",
   "ink": "#224b35",
   "accent": "#738c43",
   "symbol": "leaf"
  },
  "pack": {
   "shape": "bottle",
   "size": [
    0.092,
    0.26,
    0.092
   ],
   "colour": "#657d3c",
   "net": "500ml",
   "flash": "Fragrant",
   "tag": "Clean and easy",
   "art": "tea",
   "back": {
    "ingredients": "Green tea, vitamin C",
    "unit": "bottle",
    "recycle": "PET",
    "food": true
   }
  },
  "label": {
   "source": "painted",
   "sheet": 0,
   "cell": 0
  },
  "cells": {
   "brand": 0,
   "price": 39,
   "flavours": [
    {
     "name": "Barley tea",
     "hue": -70,
     "cell": 18
    },
    {
     "name": "Oolong",
     "hue": -35,
     "cell": 19
    }
   ]
  },
  "purpose": {
   "zone": "drinks",
   "for": [
    "Grandmother Higa",
    "Thuan"
   ],
   "why": "The everyday bottle: with lunch, on a hot walk, on the verandah.",
   "placed": "First column, eye level: the drink most people come in for is the first one they see."
  },
  "shelf": {
   "fitting": "fridge",
   "column": 0,
   "levels": [
    2,
    3,
    4
   ]
  },
  "capacity": 24,
  "supplier": "sakura"
 },
 {
  "id": "coffee",
  "inventoryName": "Canned coffee",
  "shop": "sakura",
  "name": "Canned coffee",
  "jp": "Canned coffee",
  "price": 120,
  "text": "PORT 88 · Port88\nA small can of coffee for the walk down to the harbour.",
  "bagColour": "#815549",
  "mailOrder": true,
  "brand": {
   "name": "PORT 88",
   "jp": "Port88",
   "line": "Canned coffee",
   "paper": "#322823",
   "ink": "#f5e5c1",
   "accent": "#bd4826",
   "symbol": "gull"
  },
  "pack": {
   "shape": "can",
   "size": [
    0.094,
    0.135,
    0.094
   ],
   "net": "190g",
   "flash": "Less sugar",
   "tag": "One for the harbour morning",
   "art": "coffee",
   "back": {
    "ingredients": "Milk, coffee, sugar, emulsifier",
    "unit": "bottle",
    "recycle": "CAN",
    "food": true
   }
  },
  "label": {
   "source": "painted",
   "sheet": 0,
   "cell": 1
  },
  "cells": {
   "brand": 1,
   "price": 40,
   "flavours": [
    {
     "name": "Café au lait",
     "hue": 25,
     "cell": 25
    },
    {
     "name": "Sugar free",
     "hue": -150,
     "cell": 26
    }
   ]
  },
  "purpose": {
   "zone": "drinks",
   "for": [
    "Harbour master",
    "Ms Ganaha",
    "Mac"
   ],
   "why": "A sweet canned coffee before a dawn shift or between rounds.",
   "placed": "Under the tea, where a working hand reaches without looking."
  },
  "shelf": {
   "fitting": "fridge",
   "column": 0,
   "levels": [
    0,
    1
   ]
  },
  "capacity": 24,
  "supplier": "sakura"
 },
 {
  "id": "water",
  "inventoryName": "Spring water",
  "shop": "sakura",
  "name": "Spring water",
  "jp": "Natural water",
  "price": 110,
  "text": "Water from the hills above the harbour.",
  "bagColour": "#8dbfc1",
  "brand": {
   "name": "MIZUNOWA",
   "jp": "Mizunowa",
   "line": "Natural water",
   "paper": "#d3e5df",
   "ink": "#2e6572",
   "accent": "#6dabae",
   "symbol": "wave"
  },
  "pack": {
   "shape": "bottle",
   "size": [
    0.092,
    0.26,
    0.092
   ],
   "colour": "#afd5d4",
   "net": "500ml",
   "flash": "Natural",
   "tag": "Island spring water",
   "art": "water",
   "back": {
    "ingredients": "Water (mineral water)",
    "unit": "bottle",
    "recycle": "PET",
    "food": true
   }
  },
  "label": {
   "source": "painted",
   "sheet": 0,
   "cell": 9
  },
  "cells": {
   "brand": 9,
   "price": 48,
   "flavours": [
    {
     "name": "Sparkling",
     "hue": 40,
     "cell": 20
    }
   ]
  },
  "purpose": {
   "zone": "drinks",
   "for": [
    "Riku",
    "Officer Mori"
   ],
   "why": "Spring water for runs, patrols and long afternoons on the quay.",
   "placed": "Second column, eye level: the second most asked-for drink."
  },
  "shelf": {
   "fitting": "fridge",
   "column": 1,
   "levels": [
    2,
    3,
    4
   ]
  },
  "capacity": 24,
  "supplier": "sakura"
 },
 {
  "id": "orange",
  "inventoryName": "Mandarin juice",
  "shop": "sakura",
  "name": "Mandarin juice",
  "jp": "Orange juice",
  "price": 120,
  "text": "MIKANBI · Mandarin juice",
  "bagColour": "#e5d9bc",
  "brand": {
   "name": "MIKANBI",
   "jp": "Orange day",
   "line": "Orange juice",
   "paper": "#f1a134",
   "ink": "#28502e",
   "accent": "#db7324",
   "symbol": "sun"
  },
  "pack": {
   "shape": "bottle",
   "size": [
    0.092,
    0.26,
    0.092
   ],
   "colour": "#e6a038",
   "net": "500ml",
   "flash": "100% juice",
   "tag": "Mandarin",
   "art": "orange",
   "back": {
    "ingredients": "100% mandarin juice",
    "unit": "bottle",
    "recycle": "PLA",
    "food": true
   },
   "declared": {
    "shape": "carton",
    "size": [
     0.093,
     0.2,
     0.093
    ]
   }
  },
  "label": {
   "source": "painted",
   "sheet": 1,
   "cell": 12
  },
  "cells": {
   "brand": 28,
   "price": 64,
   "flavours": [
    {
     "name": "Apple",
     "hue": 45,
     "cell": 22
    },
    {
     "name": "Grape",
     "hue": -95,
     "cell": 23
    }
   ]
  },
  "purpose": {
   "zone": "drinks",
   "for": [
    "Nhung"
   ],
   "why": "Mandarin juice for a child’s lunch, or a breakfast in a hurry.",
   "placed": "Low in the juice column, at a child’s reach."
  },
  "shelf": {
   "fitting": "fridge",
   "column": 1,
   "levels": [
    0,
    1
   ]
  },
  "capacity": 24,
  "supplier": "sakura"
 },
 {
  "id": "cola",
  "inventoryName": "Sea breeze cola",
  "shop": "sakura",
  "name": "Sea breeze cola",
  "jp": "Cola",
  "price": 120,
  "text": "A small bottle of cola.",
  "bagColour": "#b63231",
  "brand": {
   "name": "SHIOSAI",
   "jp": "Shiosai",
   "line": "Cola",
   "paper": "#b63231",
   "ink": "#fff0d3",
   "accent": "#e8b855",
   "symbol": "wave"
  },
  "pack": {
   "shape": "bottle",
   "size": [
    0.092,
    0.26,
    0.092
   ],
   "colour": "#443126",
   "net": "500ml",
   "flash": "Extra fizz",
   "tag": "Crisp and cold",
   "art": "cola",
   "back": {
    "ingredients": "Sugars, carbonation, caramel colour, acidulant, flavouring, caffeine",
    "unit": "bottle",
    "recycle": "PET",
    "food": true
   }
  },
  "label": {
   "source": "painted",
   "sheet": 0,
   "cell": 8
  },
  "cells": {
   "brand": 8,
   "price": 47,
   "flavours": [
    {
     "name": "Zero",
     "hue": 180,
     "cell": 21
    }
   ]
  },
  "purpose": {
   "zone": "drinks",
   "for": [
    "Kōji",
    "Riku"
   ],
   "why": "A cold cola after school or a shift.",
   "placed": "Eye level in the third column: the impulse drink."
  },
  "shelf": {
   "fitting": "fridge",
   "column": 2,
   "levels": [
    2,
    3,
    4
   ]
  },
  "capacity": 24,
  "supplier": "sakura"
 },
 {
  "id": "soda",
  "inventoryName": "Ramune soda",
  "shop": "sakura",
  "name": "Ramune soda",
  "jp": "Ramune",
  "price": 100,
  "text": "AOZORA · Ramune soda",
  "bagColour": "#e5d9bc",
  "brand": {
   "name": "AOZORA",
   "jp": "Blue sky",
   "line": "Ramune",
   "paper": "#d9eced",
   "ink": "#25557e",
   "accent": "#69aed0",
   "symbol": "wave"
  },
  "pack": {
   "shape": "bottle",
   "size": [
    0.074,
    0.26,
    0.074
   ],
   "colour": "#afd6da",
   "detail": "marble",
   "net": "200ml",
   "flash": "Ramune",
   "tag": "Marble inside",
   "art": "soda",
   "back": {
    "ingredients": "Sugar, carbonation, acidulant, flavouring",
    "unit": "bottle",
    "recycle": "PET",
    "food": true
   }
  },
  "label": {
   "source": "painted",
   "sheet": 1,
   "cell": 13
  },
  "cells": {
   "brand": 29,
   "price": 65,
   "flavours": [
    {
     "name": "Melon",
     "hue": -90,
     "cell": 24
    }
   ]
  },
  "purpose": {
   "zone": "drinks",
   "for": [
    "Vy"
   ],
   "why": "Ramune with the marble: the summer drink children ask for by name.",
   "placed": "Low under the cola, where children look."
  },
  "shelf": {
   "fitting": "fridge",
   "column": 2,
   "levels": [
    0,
    1
   ]
  },
  "capacity": 24,
  "supplier": "sakura"
 },
 {
  "id": "milk",
  "inventoryName": "Asamori milk",
  "shop": "sakura",
  "name": "Asamori milk",
  "jp": "Milk",
  "price": 110,
  "text": "A small carton of milk.",
  "bagColour": "#dbe5df",
  "brand": {
   "name": "ASAMORI",
   "jp": "Asamori",
   "line": "Milk",
   "paper": "#f4ebdb",
   "ink": "#356b8b",
   "accent": "#80a4bb",
   "symbol": "sun"
  },
  "pack": {
   "shape": "carton",
   "size": [
    0.093,
    0.2,
    0.093
   ],
   "net": "500ml",
   "flash": "Whole milk",
   "tag": "Asamori Dairy",
   "art": "milk",
   "back": {
    "ingredients": "100% fresh milk",
    "unit": "bottle",
    "recycle": "PLA",
    "food": true
   }
  },
  "label": {
   "source": "painted",
   "sheet": 0,
   "cell": 12
  },
  "cells": {
   "brand": 12,
   "price": 51,
   "flavours": [
    {
     "name": "Coffee milk",
     "hue": -170,
     "cell": 29
    },
    {
     "name": "Strawberry",
     "hue": 140,
     "cell": 30
    }
   ]
  },
  "purpose": {
   "zone": "drinks",
   "for": [
    "Miss Higa",
    "Thao"
   ],
   "why": "For the morning tea, the children, and the bathhouse fridge when it runs out.",
   "placed": "Top of the last column: for people who knew what they came for."
  },
  "shelf": {
   "fitting": "fridge",
   "column": 3,
   "levels": [
    3,
    4
   ]
  },
  "capacity": 24,
  "supplier": "sakura"
 },
 {
  "id": "beer",
  "inventoryName": "Umineko lager",
  "shop": "sakura",
  "name": "Umineko lager",
  "jp": "Beer",
  "price": 220,
  "text": "A chilled can of the local fictional lager.",
  "bagColour": "#c9ab59",
  "brand": {
   "name": "UMINEKO",
   "jp": "Umineko",
   "line": "Beer",
   "paper": "#eddda0",
   "ink": "#38523d",
   "accent": "#9f5433",
   "symbol": "gull"
  },
  "pack": {
   "shape": "can",
   "size": [
    0.094,
    0.135,
    0.094
   ],
   "net": "350ml",
   "flash": "Draft",
   "tag": "The harbour town lager",
   "art": "beer",
   "back": {
    "ingredients": "Malt, hops",
    "unit": "bottle",
    "recycle": "CAN",
    "food": true
   }
  },
  "label": {
   "source": "painted",
   "sheet": 0,
   "cell": 10
  },
  "cells": {
   "brand": 10,
   "price": 49,
   "flavours": [
    {
     "name": "Dry",
     "hue": -30,
     "cell": 27
    },
    {
     "name": "Black",
     "hue": 170,
     "cell": 28
    }
   ]
  },
  "purpose": {
   "zone": "drinks",
   "for": [
    "Mac",
    "Tetsuo",
    "Johansson"
   ],
   "why": "Umineko lager for the evening at home, the boat, or the walk to Minato.",
   "placed": "The column nearest the till: beer is the last thing picked up, and Thuan sees who buys it."
  },
  "shelf": {
   "fitting": "fridge",
   "column": 3,
   "levels": [
    0,
    1,
    2
   ]
  },
  "capacity": 24,
  "supplier": "sakura",
  "drink": {
   "alcohol": true,
   "container": "can",
   "handColour": "#2d6b9a"
  }
 },
 {
  "id": "rice",
  "inventoryName": "Plum rice ball",
  "shop": "sakura",
  "name": "Plum rice ball",
  "jp": "Onigiri",
  "price": 110,
  "text": "SAKURA · Sakura knot\nRice, a little pickled plum and a strip of nori. Wrapped this afternoon.",
  "bagColour": "#eee3c3",
  "mailOrder": true,
  "brand": {
   "name": "SAKURA",
   "jp": "Sakura knot",
   "line": "Plum rice ball",
   "paper": "#fff5de",
   "ink": "#354b35",
   "accent": "#ba3d39",
   "symbol": "rice"
  },
  "pack": {
   "shape": "bag",
   "size": [
    0.15,
    0.12,
    0.09
   ],
   "net": "1 piece",
   "flash": "Hand-pressed",
   "tag": "Kishu plum inside",
   "art": "rice",
   "back": {
    "ingredients": "Rice, pickled plum, nori, salt",
    "unit": "pack",
    "recycle": "PLA",
    "food": true
   }
  },
  "label": {
   "source": "painted",
   "sheet": 0,
   "cell": 2
  },
  "cells": {
   "brand": 2,
   "price": 41,
   "flavours": [
    {
     "name": "Salmon",
     "hue": -25,
     "cell": 37
    },
    {
     "name": "Tuna mayo",
     "hue": 150,
     "cell": 38
    },
    {
     "name": "Kelp",
     "hue": 95,
     "cell": 39
    }
   ]
  },
  "purpose": {
   "zone": "fresh",
   "for": [
    "Thuan",
    "Chin",
    "Ms Ganaha",
    "Officer Mori"
   ],
   "why": "The lunch eaten standing up: plum onigiri, made this afternoon.",
   "placed": "Eye level in the chiller: the shop’s best seller where nobody has to look for it."
  },
  "shelf": {
   "fitting": "chiller",
   "bay": 0,
   "deck": "upper"
  },
  "capacity": 24,
  "supplier": "sakura"
 },
 {
  "id": "bento",
  "inventoryName": "Makunouchi bento",
  "shop": "sakura",
  "name": "Makunouchi bento",
  "jp": "Makunouchi bento",
  "price": 480,
  "text": "MINATOYA · Makunouchi bento",
  "bagColour": "#e5d9bc",
  "brand": {
   "name": "MINATOYA",
   "jp": "Minatoya",
   "line": "Makunouchi bento",
   "paper": "#e4d7b6",
   "ink": "#4a3a2a",
   "accent": "#9d4a34",
   "symbol": "rice"
  },
  "pack": {
   "shape": "tray",
   "size": [
    0.19,
    0.052,
    0.135
   ],
   "net": "1 meal",
   "flash": "Makunouchi",
   "tag": "Made by hand today",
   "art": "bento",
   "back": {
    "ingredients": "Rice, grilled salmon, rolled omelette, fried chicken, simmered vegetables, pickles",
    "unit": "pack",
    "recycle": "PLA",
    "food": true
   }
  },
  "label": {
   "source": "fresh"
  },
  "cells": {
   "brand": 32,
   "price": 68,
   "flavours": [
    {
     "name": "Karaage",
     "hue": -25,
     "cell": 42
    }
   ]
  },
  "purpose": {
   "zone": "fresh",
   "for": [
    "Harbour master",
    "Tetsuo"
   ],
   "why": "A proper lunch for people who cannot leave their work: the power house, the workshop, the office.",
   "placed": "Under the rice balls: the dearer lunch beside the cheap one."
  },
  "shelf": {
   "fitting": "chiller",
   "bay": 0,
   "deck": "lower"
  },
  "capacity": 24,
  "supplier": "sakura"
 },
 {
  "id": "sandwich",
  "inventoryName": "Egg sandwiches",
  "shop": "sakura",
  "name": "Egg sandwiches",
  "jp": "Egg sandwich",
  "price": 230,
  "text": "KOMUGI · Egg sandwiches",
  "bagColour": "#e5d9bc",
  "brand": {
   "name": "KOMUGI",
   "jp": "Komugi",
   "line": "Egg sandwich",
   "paper": "#f4ecd8",
   "ink": "#6f422c",
   "accent": "#c9924c",
   "symbol": "leaf"
  },
  "pack": {
   "shape": "wedge",
   "size": [
    0.12,
    0.12,
    0.052
   ],
   "net": "2 halves",
   "flash": "Egg",
   "tag": "Fluffy egg salad",
   "art": "sandwich",
   "back": {
    "ingredients": "Bread, egg, mayonnaise, salt, pepper",
    "unit": "pack",
    "recycle": "PLA",
    "food": true
   },
   "declared": {
    "shape": "box"
   }
  },
  "label": {
   "source": "fresh"
  },
  "cells": {
   "brand": 33,
   "price": 69,
   "flavours": [
    {
     "name": "Ham",
     "hue": -30,
     "cell": 40
    },
    {
     "name": "Tuna",
     "hue": 150,
     "cell": 41
    }
   ]
  },
  "purpose": {
   "zone": "fresh",
   "for": [
    "Johansson",
    "Nhung"
   ],
   "why": "Egg sandwiches eaten at a desk or on the ferry.",
   "placed": "Middle bay, eye level, over the bread it is made from."
  },
  "shelf": {
   "fitting": "chiller",
   "bay": 1,
   "deck": "upper"
  },
  "capacity": 24,
  "supplier": "sakura"
 },
 {
  "id": "bread",
  "inventoryName": "Milk bread",
  "shop": "sakura",
  "name": "Milk bread",
  "jp": "Milk bread",
  "price": 150,
  "text": "KOMUGI · Milk bread",
  "bagColour": "#e5d9bc",
  "brand": {
   "name": "KOMUGI",
   "jp": "Komugi",
   "line": "Milk bread",
   "paper": "#f1dcae",
   "ink": "#6f422c",
   "accent": "#c9924c",
   "symbol": "leaf"
  },
  "pack": {
   "shape": "bag",
   "size": [
    0.19,
    0.235,
    0.12
   ],
   "net": "6 slices",
   "flash": "Milk",
   "tag": "Soft white loaf",
   "art": "bread",
   "back": {
    "ingredients": "Wheat flour, milk, sugar, butter, yeast, salt",
    "unit": "pack",
    "recycle": "PLA",
    "food": true
   }
  },
  "label": {
   "source": "painted",
   "sheet": 1,
   "cell": 15
  },
  "cells": {
   "brand": 31,
   "price": 67,
   "flavours": [
    {
     "name": "Melon bread",
     "hue": 60,
     "cell": 35
    },
    {
     "name": "Raisin",
     "hue": -40,
     "cell": 36
    }
   ]
  },
  "purpose": {
   "zone": "fresh",
   "for": [
    "Ms Ganaha"
   ],
   "why": "Milk bread for tomorrow’s breakfast.",
   "placed": "Under the sandwiches: the household buy below the snack."
  },
  "shelf": {
   "fitting": "chiller",
   "bay": 1,
   "deck": "lower"
  },
  "capacity": 24,
  "supplier": "sakura"
 },
 {
  "id": "pudding",
  "inventoryName": "Custard pudding",
  "shop": "sakura",
  "name": "Custard pudding",
  "jp": "Custard Pudding",
  "price": 130,
  "text": "ASAMORI · Custard pudding",
  "bagColour": "#e5d9bc",
  "brand": {
   "name": "ASAMORI",
   "jp": "Asamori",
   "line": "Custard Pudding",
   "paper": "#f6e0ab",
   "ink": "#8a5a24",
   "accent": "#c98f3c",
   "symbol": "sun"
  },
  "pack": {
   "shape": "foil-cup",
   "size": [
    0.076,
    0.062,
    0.076
   ],
   "net": "85g",
   "flash": "Custard",
   "tag": "Melt-in-the-mouth",
   "art": "pudding",
   "back": {
    "ingredients": "Milk, sugar, egg, caramel sauce",
    "unit": "pack",
    "recycle": "PLA",
    "food": true
   },
   "declared": {
    "shape": "cup"
   }
  },
  "label": {
   "source": "fresh"
  },
  "cells": {
   "brand": 34,
   "price": 70,
   "flavours": [
    {
     "name": "Caramel",
     "hue": -18,
     "cell": 33
    },
    {
     "name": "Matcha",
     "hue": 70,
     "cell": 34
    }
   ]
  },
  "purpose": {
   "zone": "fresh",
   "for": [
    "Vy",
    "Nhung",
    "Grandmother Higa"
   ],
   "why": "A small treat: after homework, after a long shelf, after the bath.",
   "placed": "Top deck of the last bay: the treat at eye level, where it is hard to walk past."
  },
  "shelf": {
   "fitting": "chiller",
   "bay": 2,
   "deck": "upper"
  },
  "capacity": 24,
  "supplier": "sakura"
 },
 {
  "id": "yogurt",
  "inventoryName": "Plain yogurt",
  "shop": "sakura",
  "name": "Plain yogurt",
  "jp": "Plain yogurt",
  "price": 110,
  "text": "ASAMORI · Plain yogurt",
  "bagColour": "#e5d9bc",
  "brand": {
   "name": "ASAMORI",
   "jp": "Asamori",
   "line": "Plain yogurt",
   "paper": "#eef0df",
   "ink": "#32638b",
   "accent": "#81aa7d",
   "symbol": "sun"
  },
  "pack": {
   "shape": "cup",
   "size": [
    0.096,
    0.078,
    0.096
   ],
   "net": "400g",
   "flash": "Plain",
   "tag": "100% fresh milk",
   "art": "yogurt",
   "back": {
    "ingredients": "Fresh milk, dairy products",
    "unit": "pack",
    "recycle": "PLA",
    "food": true
   }
  },
  "label": {
   "source": "painted",
   "sheet": 1,
   "cell": 14
  },
  "cells": {
   "brand": 30,
   "price": 66,
   "flavours": [
    {
     "name": "Aloe",
     "hue": -80,
     "cell": 31
    },
    {
     "name": "Blueberry",
     "hue": 60,
     "cell": 32
    }
   ]
  },
  "purpose": {
   "zone": "fresh",
   "for": [
    "Miss Higa"
   ],
   "why": "Plain yoghurt for a light breakfast and a careful stomach.",
   "placed": "Under the pudding, for the people with good intentions."
  },
  "shelf": {
   "fitting": "chiller",
   "bay": 2,
   "deck": "lower"
  },
  "capacity": 24,
  "supplier": "sakura"
 },
 {
  "id": "noodles",
  "inventoryName": "Instant shoyu noodles",
  "shop": "sakura",
  "name": "Instant shoyu noodles",
  "jp": "Cup noodles",
  "price": 150,
  "text": "A sealed cup of noodles to take home.",
  "bagColour": "#d8b46e",
  "brand": {
   "name": "YUNAGI",
   "jp": "Yuunagi",
   "line": "Soy sauce ramen",
   "paper": "#ecd0a1",
   "ink": "#8d3028",
   "accent": "#394e41",
   "symbol": "sun"
  },
  "pack": {
   "shape": "cup",
   "size": [
    0.136,
    0.13,
    0.136
   ],
   "net": "78g",
   "flash": "Soy sauce",
   "tag": "Ready in 3 minutes",
   "art": "noodles",
   "back": {
    "ingredients": "Fried noodles (wheat flour, vegetable oil, salt), soup (soy sauce, salt, spices), toppings (naruto, spring onion)",
    "unit": "pack",
    "recycle": "PLA",
    "food": true
   }
  },
  "label": {
   "source": "painted",
   "sheet": 0,
   "cell": 11
  },
  "cells": {
   "brand": 11,
   "price": 50,
   "flavours": [
    {
     "name": "Miso",
     "hue": 25,
     "cell": 11
    },
    {
     "name": "Curry",
     "hue": 55,
     "cell": 12
    },
    {
     "name": "Seafood",
     "hue": -150,
     "cell": 13
    }
   ]
  },
  "purpose": {
   "zone": "pantry",
   "for": [
    "Kōji",
    "Mac",
    "Riku"
   ],
   "why": "Cup noodles for a late night or a typhoon day indoors.",
   "placed": "Pantry, front face: quick food first."
  },
  "shelf": {
   "fitting": "west",
   "bay": "west-front",
   "order": 0
  },
  "capacity": 24,
  "supplier": "sakura"
 },
 {
  "id": "soup",
  "inventoryName": "Miso soup sachets",
  "shop": "sakura",
  "name": "Miso soup sachets",
  "jp": "Miso soup",
  "price": 120,
  "text": "MISATO · Miso soup sachets",
  "bagColour": "#e5d9bc",
  "brand": {
   "name": "MISATO",
   "jp": "Misato",
   "line": "Miso soup",
   "paper": "#f1dfbd",
   "ink": "#8e3529",
   "accent": "#b15231",
   "symbol": "sun"
  },
  "pack": {
   "shape": "box",
   "size": [
    0.14,
    0.17,
    0.05
   ],
   "net": "8 servings",
   "flash": "Mixed miso",
   "tag": "Just add hot water",
   "art": "soup",
   "back": {
    "ingredients": "Miso, wakame, spring onion, tofu, bonito extract",
    "unit": "pack",
    "recycle": "PLA",
    "food": true
   }
  },
  "label": {
   "source": "painted",
   "sheet": 1,
   "cell": 6
  },
  "cells": {
   "brand": 22,
   "price": 58,
   "flavours": [
    {
     "name": "Corn",
     "hue": 35,
     "cell": 14
    },
    {
     "name": "Clam",
     "hue": -140,
     "cell": 15
    }
   ]
  },
  "purpose": {
   "zone": "pantry",
   "for": [
    "Mac",
    "Ms Uezu",
    "Thao"
   ],
   "why": "Miso sachets for one bowl when cooking a pot is too much.",
   "placed": "Beside the noodles: the other thing you add hot water to."
  },
  "shelf": {
   "fitting": "west",
   "bay": "west-front",
   "order": 1
  },
  "capacity": 24,
  "supplier": "sakura"
 },
 {
  "id": "curry",
  "inventoryName": "Curry roux",
  "shop": "sakura",
  "name": "Curry roux",
  "jp": "Curry roux",
  "price": 180,
  "text": "HINODE · Curry roux",
  "bagColour": "#e5d9bc",
  "brand": {
   "name": "HINODE",
   "jp": "Sunrise",
   "line": "Curry roux",
   "paper": "#e7af32",
   "ink": "#7e3024",
   "accent": "#b73c24",
   "symbol": "sun"
  },
  "pack": {
   "shape": "box",
   "size": [
    0.16,
    0.13,
    0.045
   ],
   "net": "200g",
   "flash": "Medium hot",
   "tag": "Serves 10",
   "art": "curry",
   "back": {
    "ingredients": "Wheat flour, beef fat, curry powder, salt, sugar, spices",
    "unit": "pack",
    "recycle": "PLA",
    "food": true
   }
  },
  "label": {
   "source": "painted",
   "sheet": 1,
   "cell": 4
  },
  "cells": {
   "brand": 20,
   "price": 56,
   "flavours": [
    {
     "name": "Hot",
     "hue": -25,
     "cell": 16
    },
    {
     "name": "Mild",
     "hue": 40,
     "cell": 17
    }
   ]
  },
  "purpose": {
   "zone": "pantry",
   "for": [
    "Mrs Sato"
   ],
   "why": "Curry roux for a family dinner; Mrs Sato swears it is not for the shop.",
   "placed": "Pantry, front face, low: a heavy box for a cook who comes back every week."
  },
  "shelf": {
   "fitting": "west",
   "bay": "west-front",
   "order": 2
  },
  "capacity": 24,
  "supplier": "sakura"
 },
 {
  "id": "soy",
  "inventoryName": "Soy sauce",
  "shop": "sakura",
  "name": "Soy sauce",
  "jp": "Soy sauce",
  "price": 160,
  "text": "KAMEJIRUSHI · Soy sauce",
  "bagColour": "#e5d9bc",
  "brand": {
   "name": "KAMEJIRUSHI",
   "jp": "Turtle",
   "line": "Soy sauce",
   "paper": "#efe2c7",
   "ink": "#722b24",
   "accent": "#ac352b",
   "symbol": "flower"
  },
  "pack": {
   "shape": "bottle",
   "size": [
    0.092,
    0.26,
    0.092
   ],
   "colour": "#392d23",
   "net": "500ml",
   "flash": "Brewed",
   "tag": "Dark soy",
   "art": "soy",
   "back": {
    "ingredients": "Soybeans, wheat, salt",
    "unit": "pack",
    "recycle": "PET",
    "food": true
   }
  },
  "label": {
   "source": "painted",
   "sheet": 1,
   "cell": 5
  },
  "cells": {
   "brand": 21,
   "price": 57,
   "flavours": []
  },
  "purpose": {
   "zone": "pantry",
   "for": [
    "Mrs Sato",
    "Thao"
   ],
   "why": "Soy sauce for a kitchen that ran out mid-service.",
   "placed": "Pantry, back face: the staple, found by people who already know where it is."
  },
  "shelf": {
   "fitting": "west",
   "bay": "west-back",
   "order": 0
  },
  "capacity": 24,
  "supplier": "sakura"
 },
 {
  "id": "tuna",
  "inventoryName": "Tinned tuna",
  "shop": "sakura",
  "name": "Tinned tuna",
  "jp": "Tuna flakes",
  "price": 160,
  "text": "SHIOHAMA · Tinned tuna",
  "bagColour": "#e5d9bc",
  "brand": {
   "name": "SHIOHAMA",
   "jp": "Ushiohama",
   "line": "Tuna flakes",
   "paper": "#dce4d7",
   "ink": "#265c6b",
   "accent": "#679999",
   "symbol": "gull"
  },
  "pack": {
   "shape": "can",
   "size": [
    0.102,
    0.046,
    0.102
   ],
   "net": "80g",
   "flash": "In oil",
   "tag": "Tuna flakes",
   "art": "tuna",
   "back": {
    "ingredients": "Tuna, soybean oil, salt, vegetable extract",
    "unit": "pack",
    "recycle": "CAN",
    "food": true
   }
  },
  "label": {
   "source": "painted",
   "sheet": 1,
   "cell": 8
  },
  "cells": {
   "brand": 24,
   "price": 60,
   "flavours": []
  },
  "purpose": {
   "zone": "pantry",
   "for": [
    "Nhung",
    "Mac"
   ],
   "why": "Tinned tuna for onigiri at home and for the cat that is not officially fed.",
   "placed": "Back face, with the other tins."
  },
  "shelf": {
   "fitting": "west",
   "bay": "west-back",
   "order": 1
  },
  "capacity": 24,
  "supplier": "sakura"
 },
 {
  "id": "peaches",
  "inventoryName": "Tinned peaches",
  "shop": "sakura",
  "name": "Tinned peaches",
  "jp": "White peach pickled in syrup",
  "price": 190,
  "text": "MOMOSATO · Tinned peaches",
  "bagColour": "#e5d9bc",
  "brand": {
   "name": "MOMOSATO",
   "jp": "Momosato",
   "line": "White peach pickled in syrup",
   "paper": "#f5e4c9",
   "ink": "#a95151",
   "accent": "#cd8b7c",
   "symbol": "leaf"
  },
  "pack": {
   "shape": "can",
   "size": [
    0.106,
    0.095,
    0.106
   ],
   "net": "425g",
   "flash": "White peach",
   "tag": "In light syrup",
   "art": "peaches",
   "back": {
    "ingredients": "White peaches, sugar, acidulant",
    "unit": "pack",
    "recycle": "CAN",
    "food": true
   }
  },
  "label": {
   "source": "painted",
   "sheet": 1,
   "cell": 7
  },
  "cells": {
   "brand": 23,
   "price": 59,
   "flavours": []
  },
  "purpose": {
   "zone": "pantry",
   "for": [
    "Grandmother Higa",
    "Miss Higa"
   ],
   "why": "Tinned peaches for visiting someone who is ill, as one does.",
   "placed": "Back face, high: an occasional buy, not in the way."
  },
  "shelf": {
   "fitting": "west",
   "bay": "west-back",
   "order": 2
  },
  "capacity": 24,
  "supplier": "sakura"
 },
 {
  "id": "chips",
  "inventoryName": "Salted potato crisps",
  "shop": "sakura",
  "name": "Salted potato crisps",
  "jp": "Potato chips",
  "price": 100,
  "text": "KOGANE · Salted potato crisps",
  "bagColour": "#e5d9bc",
  "brand": {
   "name": "KOGANE",
   "jp": "Kogane",
   "line": "Potato chips",
   "paper": "#f8dc7e",
   "ink": "#a42a23",
   "accent": "#bf3928",
   "symbol": "sun"
  },
  "pack": {
   "shape": "bag",
   "size": [
    0.16,
    0.22,
    0.07
   ],
   "net": "60g",
   "flash": "Lightly salted",
   "tag": "Crunchy and good",
   "art": "chips",
   "back": {
    "ingredients": "Potatoes, vegetable oil, salt",
    "unit": "pack",
    "recycle": "PLA",
    "food": true
   }
  },
  "label": {
   "source": "painted",
   "sheet": 1,
   "cell": 0
  },
  "cells": {
   "brand": 16,
   "price": 52,
   "flavours": [
    {
     "name": "Nori seaweed",
     "hue": 95,
     "cell": 0
    },
    {
     "name": "Consommé",
     "hue": -38,
     "cell": 1
    },
    {
     "name": "Sour cream",
     "hue": 150,
     "cell": 2
    }
   ]
  },
  "purpose": {
   "zone": "sweets",
   "for": [
    "Mr Fujita",
    "Kōji"
   ],
   "why": "Salted crisps with a beer or a baseball game on the radio.",
   "placed": "Front face at a grown-up’s eye, seen on the way back from the beer."
  },
  "shelf": {
   "fitting": "middle",
   "bay": "middle-front",
   "order": 1
  },
  "capacity": 24,
  "supplier": "sakura"
 },
 {
  "id": "crackers",
  "inventoryName": "Soy rice crackers",
  "shop": "sakura",
  "name": "Soy rice crackers",
  "jp": "Soy sauce cracker",
  "price": 110,
  "text": "HAMABE · Soy rice crackers",
  "bagColour": "#e5d9bc",
  "brand": {
   "name": "HAMABE",
   "jp": "Hamabe",
   "line": "Soy sauce cracker",
   "paper": "#f1e2bf",
   "ink": "#233b51",
   "accent": "#ac7840",
   "symbol": "wave"
  },
  "pack": {
   "shape": "bag",
   "size": [
    0.16,
    0.22,
    0.07
   ],
   "net": "12 pieces",
   "flash": "Soy sauce",
   "tag": "Toasted soy glaze",
   "art": "crackers",
   "back": {
    "ingredients": "Rice, soy sauce, sugar, nori",
    "unit": "pack",
    "recycle": "PLA",
    "food": true
   }
  },
  "label": {
   "source": "painted",
   "sheet": 1,
   "cell": 1
  },
  "cells": {
   "brand": 17,
   "price": 53,
   "flavours": [
    {
     "name": "Shrimp",
     "hue": -28,
     "cell": 3
    },
    {
     "name": "Sesame",
     "hue": 40,
     "cell": 4
    }
   ]
  },
  "purpose": {
   "zone": "sweets",
   "for": [
    "Grandmother Higa",
    "Mrs Sato",
    "Nhung"
   ],
   "why": "Soy rice crackers with tea, for visitors.",
   "placed": "Front face, the low boards: a big bag for visitors, easy to lift down, under the crisps."
  },
  "shelf": {
   "fitting": "middle",
   "bay": "middle-front",
   "order": 0
  },
  "capacity": 24,
  "supplier": "sakura"
 },
 {
  "id": "biscuit",
  "inventoryName": "Butter biscuits",
  "shop": "sakura",
  "name": "Butter biscuits",
  "jp": "Biscuit",
  "price": 100,
  "text": "KOMOREBI · Komorebi\nA paper packet of biscuits. The corner is folded closed with care.",
  "bagColour": "#c19464",
  "mailOrder": true,
  "brand": {
   "name": "KOMOREBI",
   "jp": "Komorebi",
   "line": "Butter biscuit",
   "paper": "#f5e4ad",
   "ink": "#982d24",
   "accent": "#ce9234",
   "symbol": "sun"
  },
  "pack": {
   "shape": "box",
   "size": [
    0.18,
    0.22,
    0.075
   ],
   "net": "12 pieces",
   "flash": "Real butter",
   "tag": "Baked crisp",
   "art": "biscuit",
   "back": {
    "ingredients": "Wheat flour, butter, sugar, egg, salt",
    "unit": "pack",
    "recycle": "PLA",
    "food": true
   }
  },
  "label": {
   "source": "painted",
   "sheet": 0,
   "cell": 3
  },
  "cells": {
   "brand": 3,
   "price": 42,
   "flavours": [
    {
     "name": "Chocolate",
     "hue": -25,
     "cell": 5
    },
    {
     "name": "Strawberry",
     "hue": -60,
     "cell": 6
    }
   ]
  },
  "purpose": {
   "zone": "sweets",
   "for": [
    "Nhung",
    "Miss Higa",
    "Thuan"
   ],
   "why": "Butter biscuits for a reading afternoon or a night at the press.",
   "placed": "Front face, top: the gift-sized packet where it can be seen."
  },
  "shelf": {
   "fitting": "middle",
   "bay": "middle-front",
   "order": 2
  },
  "capacity": 24,
  "supplier": "sakura"
 },
 {
  "id": "chocolate",
  "inventoryName": "Milk chocolate",
  "shop": "sakura",
  "name": "Milk chocolate",
  "jp": "Milk chocolate",
  "price": 100,
  "text": "TSUKINO · Milk chocolate",
  "bagColour": "#e5d9bc",
  "brand": {
   "name": "TSUKINO",
   "jp": "Moon",
   "line": "Milk chocolate",
   "paper": "#67252b",
   "ink": "#f4d48a",
   "accent": "#a07443",
   "symbol": "star"
  },
  "pack": {
   "shape": "box",
   "size": [
    0.17,
    0.1,
    0.018
   ],
   "net": "50g",
   "flash": "Milk",
   "tag": "Melts smoothly",
   "art": "chocolate",
   "back": {
    "ingredients": "Sugar, cocoa mass, whole milk powder, cocoa butter, flavouring",
    "unit": "pack",
    "recycle": "PLA",
    "food": true
   },
   "declared": {
    "shape": "flat"
   }
  },
  "label": {
   "source": "painted",
   "sheet": 1,
   "cell": 2
  },
  "cells": {
   "brand": 18,
   "price": 54,
   "flavours": [
    {
     "name": "Bitter",
     "hue": 25,
     "cell": 9
    },
    {
     "name": "Strawberry",
     "hue": -40,
     "cell": 10
    }
   ]
  },
  "purpose": {
   "zone": "sweets",
   "for": [
    "Vy"
   ],
   "why": "Milk chocolate after school.",
   "placed": "Back face, low: at a child’s eye, below a parent’s."
  },
  "shelf": {
   "fitting": "middle",
   "bay": "middle-back",
   "order": 1
  },
  "capacity": 24,
  "supplier": "sakura"
 },
 {
  "id": "candy",
  "inventoryName": "Fruit sweets",
  "shop": "sakura",
  "name": "Fruit sweets",
  "jp": "Fruit candy",
  "price": 90,
  "text": "MARUAME · Fruit sweets",
  "bagColour": "#e5d9bc",
  "brand": {
   "name": "MARUAME",
   "jp": "Maruame",
   "line": "Fruit candy",
   "paper": "#f6cd4d",
   "ink": "#315a36",
   "accent": "#e8812b",
   "symbol": "sun"
  },
  "pack": {
   "shape": "bag",
   "size": [
    0.16,
    0.22,
    0.07
   ],
   "net": "90g",
   "flash": "5 flavours",
   "tag": "Made with fruit juice",
   "art": "candy",
   "back": {
    "ingredients": "Sugar, glucose syrup, fruit juice, acidulant, flavouring, colour",
    "unit": "pack",
    "recycle": "PLA",
    "food": true
   }
  },
  "label": {
   "source": "painted",
   "sheet": 1,
   "cell": 3
  },
  "cells": {
   "brand": 19,
   "price": 55,
   "flavours": [
    {
     "name": "Melon",
     "hue": 90,
     "cell": 7
    },
    {
     "name": "Grape",
     "hue": -110,
     "cell": 8
    }
   ]
  },
  "purpose": {
   "zone": "sweets",
   "for": [
    "Vy"
   ],
   "why": "Fruit sweets, the ten-yen kind of treat.",
   "placed": "The lowest shelf of the back face, where small hands find it first."
  },
  "shelf": {
   "fitting": "middle",
   "bay": "middle-back",
   "order": 0
  },
  "capacity": 24,
  "supplier": "sakura"
 },
 {
  "id": "detergent",
  "inventoryName": "Laundry powder",
  "shop": "sakura",
  "name": "Laundry powder",
  "jp": "Washing detergent",
  "price": 240,
  "text": "SUZUKAZE · Laundry powder",
  "bagColour": "#e5d9bc",
  "brand": {
   "name": "SUZUKAZE",
   "jp": "Suzukaze",
   "line": "Washing detergent",
   "paper": "#eef0df",
   "ink": "#284e81",
   "accent": "#dd7b33",
   "symbol": "wave"
  },
  "pack": {
   "shape": "box",
   "size": [
    0.18,
    0.255,
    0.095
   ],
   "net": "1.0kg",
   "flash": "Whiter whites",
   "tag": "Laundry powder",
   "art": "detergent",
   "back": {
    "ingredients": "Surfactants, carbonates, optical brightener, enzymes",
    "unit": "pack",
    "recycle": "PLA",
    "food": false
   }
  },
  "label": {
   "source": "painted",
   "sheet": 1,
   "cell": 9
  },
  "cells": {
   "brand": 25,
   "price": 61,
   "flavours": [
    {
     "name": "Floral",
     "hue": -80,
     "cell": 43
    }
   ]
  },
  "purpose": {
   "zone": "daily",
   "for": [
    "Miss Higa"
   ],
   "why": "Laundry powder: the bathhouse towels and a family’s week.",
   "placed": "Bottom of the front face: the heaviest thing in the shop, low and near the door out."
  },
  "shelf": {
   "fitting": "east",
   "bay": "east-front-1",
   "order": 0
  },
  "capacity": 24,
  "supplier": "sakura"
 },
 {
  "id": "soap",
  "inventoryName": "Sakura soap",
  "shop": "sakura",
  "name": "Sakura soap",
  "jp": "Soap",
  "price": 90,
  "text": "HANAMORI · Hanamori\nA lightly scented bar wrapped in pale pink paper.",
  "bagColour": "#c8899b",
  "mailOrder": true,
  "brand": {
   "name": "HANAMORI",
   "jp": "Hanamori",
   "line": "Soap",
   "paper": "#f8dedb",
   "ink": "#944355",
   "accent": "#ba727e",
   "symbol": "flower"
  },
  "pack": {
   "shape": "box",
   "size": [
    0.14,
    0.08,
    0.07
   ],
   "net": "100g",
   "flash": "Gentle",
   "tag": "Flower scent",
   "art": "soap",
   "back": {
    "ingredients": "Soap base, fragrance, glycerin",
    "unit": "pack",
    "recycle": "PLA",
    "food": false
   },
   "declared": {
    "size": [
     0.1,
     0.065,
     0.04
    ]
   }
  },
  "label": {
   "source": "painted",
   "sheet": 0,
   "cell": 4
  },
  "cells": {
   "brand": 4,
   "price": 43,
   "flavours": [
    {
     "name": "Citrus",
     "hue": 70,
     "cell": 44
    },
    {
     "name": "Mint",
     "hue": 140,
     "cell": 45
    }
   ]
  },
  "purpose": {
   "zone": "daily",
   "for": [
    "Miss Higa",
    "Thuan"
   ],
   "why": "Sakura soap for the bath and the shop’s own washroom.",
   "placed": "Above the detergent: washing beside washing."
  },
  "shelf": {
   "fitting": "east",
   "bay": "east-front-1",
   "order": 1
  },
  "capacity": 24,
  "supplier": "sakura"
 },
 {
  "id": "tissues",
  "inventoryName": "Facial tissues",
  "shop": "sakura",
  "name": "Facial tissues",
  "jp": "Facial tissue",
  "price": 130,
  "text": "KOMACHI · Facial tissues",
  "bagColour": "#e5d9bc",
  "brand": {
   "name": "KOMACHI",
   "jp": "Komachi",
   "line": "Facial tissue",
   "paper": "#dce5d2",
   "ink": "#c25a58",
   "accent": "#99b6a0",
   "symbol": "flower"
  },
  "pack": {
   "shape": "box",
   "size": [
    0.22,
    0.075,
    0.11
   ],
   "detail": "tissue-slot",
   "net": "160 pairs",
   "flash": "Soft",
   "tag": "2-ply",
   "art": "tissues",
   "back": {
    "ingredients": "100% pulp",
    "unit": "pack",
    "recycle": "PLA",
    "food": false
   }
  },
  "label": {
   "source": "painted",
   "sheet": 1,
   "cell": 10
  },
  "cells": {
   "brand": 26,
   "price": 62,
   "flavours": [
    {
     "name": "Lotion",
     "hue": -60,
     "cell": 46
    }
   ]
  },
  "purpose": {
   "zone": "daily",
   "for": [
    "Miss Higa",
    "Nhung",
    "Officer Mori"
   ],
   "why": "Tissues for hay fever, a cold, or a sad film.",
   "placed": "Front face, next bay: bulky and light, at hand height."
  },
  "shelf": {
   "fitting": "east",
   "bay": "east-front-2",
   "order": 0
  },
  "capacity": 24,
  "supplier": "sakura"
 },
 {
  "id": "toothpaste",
  "inventoryName": "Mint toothpaste",
  "shop": "sakura",
  "name": "Mint toothpaste",
  "jp": "Medicinal toothpaste",
  "price": 180,
  "text": "HAKUSEN · Mint toothpaste",
  "bagColour": "#e5d9bc",
  "brand": {
   "name": "HAKUSEN",
   "jp": "White rice",
   "line": "Medicinal toothpaste",
   "paper": "#f2efe5",
   "ink": "#20518a",
   "accent": "#be4038",
   "symbol": "star"
  },
  "pack": {
   "shape": "box",
   "size": [
    0.205,
    0.05,
    0.045
   ],
   "net": "120g",
   "flash": "Medicated",
   "tag": "Mint flavour",
   "art": "toothpaste",
   "back": {
    "ingredients": "Calcium carbonate, glycerin, flavouring, sodium fluoride",
    "unit": "pack",
    "recycle": "PLA",
    "food": false
   }
  },
  "label": {
   "source": "painted",
   "sheet": 1,
   "cell": 11
  },
  "cells": {
   "brand": 27,
   "price": 63,
   "flavours": [
    {
     "name": "Mint",
     "hue": 120,
     "cell": 47
    }
   ]
  },
  "purpose": {
   "zone": "daily",
   "for": [
    "Johansson"
   ],
   "why": "Mint toothpaste, the thing you notice has run out at night.",
   "placed": "Above the tissues, with the bathroom."
  },
  "shelf": {
   "fitting": "east",
   "bay": "east-front-2",
   "order": 1
  },
  "capacity": 24,
  "supplier": "sakura"
 },
 {
  "id": "battery",
  "inventoryName": "Radio batteries",
  "shop": "sakura",
  "name": "Radio batteries",
  "jp": "Dry battery",
  "price": 180,
  "text": "HOSHIMARU · Hoshimaru\nTwo dry-cell batteries. Ask before fitting them to the shop radio.",
  "bagColour": "#b07856",
  "mailOrder": true,
  "brand": {
   "name": "HOSHIMARU",
   "jp": "Hoshimaru",
   "line": "Dry battery · AA",
   "paper": "#253f59",
   "ink": "#f9e1a0",
   "accent": "#c15734",
   "symbol": "star"
  },
  "pack": {
   "shape": "box",
   "size": [
    0.105,
    0.15,
    0.03
   ],
   "net": "4 pack",
   "flash": "Long life",
   "tag": "Alkaline AA",
   "art": "battery",
   "back": {
    "ingredients": "Alkaline battery LR6 1.5V",
    "unit": "pack",
    "recycle": "PLA",
    "food": false
   }
  },
  "label": {
   "source": "painted",
   "sheet": 0,
   "cell": 7
  },
  "cells": {
   "brand": 7,
   "price": 46,
   "flavours": [
    {
     "name": "AAA",
     "hue": 140,
     "cell": 48
    }
   ]
  },
  "purpose": {
   "zone": "daily",
   "for": [
    "Chin",
    "Tetsuo",
    "Harbour master"
   ],
   "why": "Dry cells for radios, torches and the harbour lamp.",
   "placed": "Back face, nearest the till: small, dear and easy to pocket, so Thuan can see them."
  },
  "shelf": {
   "fitting": "east",
   "bay": "east-back-1",
   "order": 0
  },
  "capacity": 24,
  "supplier": "sakura"
 },
 {
  "id": "notebook",
  "inventoryName": "Pocket notebook",
  "shop": "sakura",
  "name": "Pocket notebook",
  "jp": "University Notes",
  "price": 80,
  "text": "SHIOFUMI · Shiofumi\nRuled pages for tide times, errands and things you meant to remember.",
  "bagColour": "#878c92",
  "mailOrder": true,
  "brand": {
   "name": "SHIOFUMI",
   "jp": "Shiofumi",
   "line": "University Notes",
   "paper": "#e8e1c8",
   "ink": "#364d66",
   "accent": "#63849d",
   "symbol": "wave"
  },
  "pack": {
   "shape": "box",
   "size": [
    0.15,
    0.18,
    0.025
   ],
   "detail": "pages",
   "net": "30 sheets",
   "flash": "7mm ruled",
   "tag": "Semi-B5",
   "art": "notebook",
   "back": {
    "ingredients": "Fine paper · 30 sheets · 7mm ruled · sewn binding",
    "unit": "pack",
    "recycle": "PLA",
    "food": false
   },
   "declared": {
    "shape": "flat",
    "size": [
     0.18,
     0.252,
     0.006
    ]
   }
  },
  "label": {
   "source": "painted",
   "sheet": 0,
   "cell": 5
  },
  "cells": {
   "brand": 5,
   "price": 44,
   "flavours": [
    {
     "name": "Graph paper",
     "hue": 60,
     "cell": 49
    }
   ]
  },
  "purpose": {
   "zone": "daily",
   "for": [
    "Johansson",
    "Nhung",
    "Vy"
   ],
   "why": "Pocket notebooks for tide times, articles and homework.",
   "placed": "Beside the batteries: stationery with the small things."
  },
  "shelf": {
   "fitting": "east",
   "bay": "east-back-1",
   "order": 1
  },
  "capacity": 24,
  "supplier": "sakura"
 },
 {
  "id": "postcard",
  "inventoryName": "Harbour postcard",
  "shop": "sakura",
  "name": "Harbour postcard",
  "jp": "Postcard",
  "price": 50,
  "text": "SHIOFUMI · Shiofumi\nA printed view of the old breakwater. Thuan knows the photographer.",
  "bagColour": "#799aa5",
  "mailOrder": true,
  "brand": {
   "name": "SHIOFUMI",
   "jp": "Shiofumi",
   "line": "Port postcard",
   "paper": "#efe4c8",
   "ink": "#2c5f6e",
   "accent": "#bf633e",
   "symbol": "gull"
  },
  "pack": {
   "shape": "box",
   "size": [
    0.15,
    0.18,
    0.025
   ],
   "detail": "pages",
   "net": "1 card",
   "flash": "Harbour town",
   "tag": "Harbour morning",
   "art": "postcard",
   "back": {
    "ingredients": "Postcard · a morning on the harbour",
    "unit": "pack",
    "recycle": "PLA",
    "food": false
   },
   "declared": {
    "shape": "flat",
    "size": [
     0.148,
     0.1,
     0.004
    ]
   }
  },
  "label": {
   "source": "painted",
   "sheet": 0,
   "cell": 6
  },
  "cells": {
   "brand": 6,
   "price": 45,
   "flavours": []
  },
  "purpose": {
   "zone": "daily",
   "for": [
    "Johansson",
    "Nhung"
   ],
   "why": "Harbour postcards for visitors and for letters to the main island.",
   "placed": "Back face, by the till, beside the stamps Thuan sells."
  },
  "shelf": {
   "fitting": "east",
   "bay": "east-back-2",
   "order": 0
  },
  "capacity": 24,
  "supplier": "sakura"
 },
 {
  "id": "bun",
  "inventoryName": "Steamed pork bun",
  "shop": "sakura",
  "name": "Steamed pork bun",
  "jp": "Meat bun",
  "price": 150,
  "unitCost": 80,
  "text": "A wrapped steamed bun to take away.",
  "bagColour": null,
  "brand": {
   "name": "SAKURA",
   "jp": "Sakura Shop",
   "line": "Other meat buns",
   "paper": "#f3deb6",
   "ink": "#934033",
   "accent": "#d3934c",
   "symbol": "sun"
  },
  "pack": {
   "shape": "bag",
   "size": [
    0.15,
    0.12,
    0.09
   ],
   "net": "1 piece",
   "flash": "Piping hot",
   "tag": "Pork bun",
   "art": "bun",
   "back": {
    "ingredients": "Wheat flour, pork, onion, soy sauce, sugar",
    "unit": "pack",
    "recycle": "PLA",
    "food": true
   }
  },
  "label": {
   "source": "painted",
   "sheet": 0,
   "cell": 14
  },
  "cells": {
   "key": "buns",
   "brand": 14,
   "price": null,
   "flavours": []
  },
  "purpose": {
   "zone": "counter",
   "for": [
    "Officer Mori",
    "Ms Uezu",
    "Kōji",
    "Vy"
   ],
   "why": "A steamed pork bun to eat walking out of the door.",
   "placed": "In the steamer on the counter: smelt while paying, bought on impulse."
  },
  "shelf": {
   "fitting": "steamer"
  },
  "capacity": 12,
  "supplier": "sakura"
 }
]);
/** A product by its id (its save key). */
export const PRODUCT_BY_ID=freeze(Object.assign(Object.create(null),Object.fromEntries(PRODUCTS.map(p=>[p.id,p]))));
/** Printed matter in the label atlas that is not stock: the delivery carton, the shop's mark, the magazines, the paper. */
export const PRINTS=freeze([
 {
  "key": "stock",
  "cell": 13,
  "what": "Sakura's delivery carton: the cartons on the delivery shelf, by the back door and in the back room.",
  "brand": {
   "name": "SAKURA",
   "jp": "Sakura Shop",
   "line": "Delivery box · Handle with care",
   "paper": "#e5d1ac",
   "ink": "#60523f",
   "accent": "#9d493d",
   "symbol": "flower"
  },
  "pack": {
   "shape": "box",
   "size": [
    0.32,
    0.22,
    0.25
   ]
  }
 },
 {
  "key": "shop",
  "cell": 15,
  "what": "Sakura Shōten's own mark, painted on the first packaging sheet; nothing on the floor carries it yet."
 },
 {
  "key": "magazine-sea",
  "cell": 35,
  "what": "A monthly for the rack under the window: read standing up, never sold.",
  "brand": {
   "name": "UMIKAZE",
   "jp": "Sea breeze",
   "line": "Monthly Sea breeze",
   "paper": "#d7e5ec",
   "ink": "#20496b",
   "accent": "#3d7fa6",
   "symbol": "wave"
  },
  "pack": {
   "shape": "magazine",
   "size": [
    0.21,
    0.245,
    0.013
   ]
  }
 },
 {
  "key": "magazine-night",
  "cell": 36,
  "what": "A weekly for the rack under the window: read standing up, never sold.",
  "brand": {
   "name": "HOSHIZORA",
   "jp": "Starzora",
   "line": "Weekly Starry sky",
   "paper": "#2b3a5c",
   "ink": "#f2e2b0",
   "accent": "#c58a3a",
   "symbol": "star"
  },
  "pack": {
   "shape": "magazine",
   "size": [
    0.21,
    0.245,
    0.013
   ]
  }
 },
 {
  "key": "magazine-rod",
  "cell": 37,
  "what": "The fishing monthly for the rack under the window: read standing up, never sold.",
  "brand": {
   "name": "KATSUO",
   "jp": "Bonito",
   "line": "Fishing and the sea",
   "paper": "#f0e3c4",
   "ink": "#2f5c45",
   "accent": "#b5622f",
   "symbol": "gull"
  },
  "pack": {
   "shape": "magazine",
   "size": [
    0.21,
    0.245,
    0.013
   ]
  }
 },
 {
  "key": "newspaper",
  "cell": 38,
  "what": "The Minato Shimbun's evening edition, on the rack and in the comics.",
  "brand": {
   "name": "MINATO",
   "jp": "Minato Shimbun",
   "line": "Evening edition",
   "paper": "#e8e4d6",
   "ink": "#3a3530",
   "accent": "#8d3f31",
   "symbol": "wave"
  },
  "pack": {
   "shape": "newspaper",
   "size": [
    0.285,
    0.021,
    0.205
   ]
  }
 }
]);
/** Lines taken off sale: kept so old saves still know them; their ids are never used again. */
export const RETIRED=freeze([]);

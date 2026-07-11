"""
Synthetic sample data — tiny datasets mirroring real schemas.
Used when USE_SAMPLE_DATA=true so the app runs without real archives.
"""

EUROPEAN_SAMPLE = [
    {
        "Brand": "BMW",
        "Model Name": "BMW iX1",
        "Fuel Type": "Electric",
        "Horsepower (HP)": 313,
        "Energy Cost (€/100km)": 4.5,
        "Efficiency (Wh/km)": 170,
        "Maintenance Cost (€/year)": 900,
        "Safety Rating (Euro NCAP)": 5,
        "Boot Capacity (L)": 490,
        "Seating Capacity": 5,
    },
    {
        "Brand": "BMW",
        "Model Name": "BMW 111",
        "Fuel Type": "Petrol",
        "Horsepower (HP)": 150,
        "Energy Cost (€/100km)": 9.2,
        "Efficiency (Wh/km)": None,
        "Maintenance Cost (€/year)": 600,
        "Safety Rating (Euro NCAP)": 4,
        "Boot Capacity (L)": 380,
        "Seating Capacity": 5,
    },
    {
        "Brand": "Toyota",
        "Model Name": "Corolla",
        "Fuel Type": "Hybrid",
        "Horsepower (HP)": 122,
        "Energy Cost (€/100km)": 5.8,
        "Efficiency (Wh/km)": None,
        "Maintenance Cost (€/year)": 450,
        "Safety Rating (Euro NCAP)": 5,
        "Boot Capacity (L)": 361,
        "Seating Capacity": 5,
    },
    {
        "Brand": "Volkswagen",
        "Model Name": "Golf",
        "Fuel Type": "Diesel",
        "Horsepower (HP)": 115,
        "Energy Cost (€/100km)": 6.5,
        "Efficiency (Wh/km)": None,
        "Maintenance Cost (€/year)": 500,
        "Safety Rating (Euro NCAP)": 5,
        "Boot Capacity (L)": 380,
        "Seating Capacity": 5,
    },
    {
        "Brand": "Tesla",
        "Model Name": "Model 3",
        "Fuel Type": "Electric",
        "Horsepower (HP)": 283,
        "Energy Cost (€/100km)": 4.0,
        "Efficiency (Wh/km)": 150,
        "Maintenance Cost (€/year)": 700,
        "Safety Rating (Euro NCAP)": 5,
        "Boot Capacity (L)": 425,
        "Seating Capacity": 5,
    },
]

UCI_SAMPLE = [
    {"buying": "vhigh", "maint": "high", "doors": "4", "persons": "more", "lug_boot": "big", "safety": "high", "class": "good"},
    {"buying": "vhigh", "maint": "med", "doors": "4", "persons": "4", "lug_boot": "med", "safety": "high", "class": "good"},
    {"buying": "med", "maint": "med", "doors": "4", "persons": "more", "lug_boot": "big", "safety": "high", "class": "vgood"},
    {"buying": "med", "maint": "low", "doors": "4", "persons": "4", "lug_boot": "med", "safety": "med", "class": "acc"},
    {"buying": "med", "maint": "high", "doors": "2", "persons": "2", "lug_boot": "small", "safety": "med", "class": "acc"},
    {"buying": "low", "maint": "low", "doors": "4", "persons": "more", "lug_boot": "big", "safety": "high", "class": "vgood"},
]

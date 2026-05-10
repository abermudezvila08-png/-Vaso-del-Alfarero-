"""Seed the database with initial data."""

from datetime import date, time

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth import hash_password
from backend.models import LunchPackage, Table, TimeSlot, User, UserRole
from backend.models_inventory import (
    DailySales,
    Ingredient,
    OperatingCost,
    Recipe,
    RecipeIngredient,
)


async def seed_data(db: AsyncSession) -> None:
    existing = await db.execute(select(User).limit(1))
    if existing.scalar_one_or_none():
        return

    # Admin user
    admin = User(
        name="Administrador",
        email="admin@restaurante.com",
        phone="+1234567890",
        password_hash=hash_password("admin123"),
        role=UserRole.ADMIN,
        is_verified=True,
    )
    db.add(admin)

    # Staff user
    staff = User(
        name="Personal",
        email="staff@restaurante.com",
        phone="+1234567891",
        password_hash=hash_password("staff123"),
        role=UserRole.STAFF,
        is_verified=True,
    )
    db.add(staff)

    # Tables
    tables = [
        Table(name="Mesa 1", capacity=2, location="Terraza"),
        Table(name="Mesa 2", capacity=2, location="Terraza"),
        Table(name="Mesa 3", capacity=4, location="Interior"),
        Table(name="Mesa 4", capacity=4, location="Interior"),
        Table(name="Mesa 5", capacity=6, location="Interior"),
        Table(name="Mesa 6", capacity=6, location="Salón Privado"),
        Table(name="Mesa 7", capacity=8, location="Salón Privado"),
        Table(name="Mesa 8", capacity=10, location="Salón VIP"),
    ]
    for t in tables:
        db.add(t)

    # Time slots
    slots = [
        TimeSlot(start_time=time(10, 0), end_time=time(11, 30), label="10:00 - 11:30 AM"),
        TimeSlot(start_time=time(11, 30), end_time=time(13, 0), label="11:30 AM - 1:00 PM"),
        TimeSlot(start_time=time(13, 0), end_time=time(14, 30), label="1:00 - 2:30 PM"),
        TimeSlot(start_time=time(14, 30), end_time=time(16, 0), label="2:30 - 4:00 PM"),
        TimeSlot(start_time=time(18, 0), end_time=time(19, 30), label="6:00 - 7:30 PM"),
        TimeSlot(start_time=time(19, 30), end_time=time(21, 0), label="7:30 - 9:00 PM"),
        TimeSlot(start_time=time(21, 0), end_time=time(22, 30), label="9:00 - 10:30 PM"),
    ]
    for s in slots:
        db.add(s)

    # Lunch packages
    packages = [
        LunchPackage(
            name="Paquete Básico",
            description="Entrada + Plato principal + Bebida",
            price=25.00,
        ),
        LunchPackage(
            name="Paquete Premium",
            description="Entrada + Plato principal + Postre + 2 Bebidas",
            price=45.00,
        ),
        LunchPackage(
            name="Paquete VIP",
            description="2 Entradas + Plato principal + Postre + Vino + Café",
            price=75.00,
        ),
        LunchPackage(
            name="Paquete Ejecutivo",
            description="Entrada + Plato principal + Postre + Bebida + Café",
            price=35.00,
        ),
    ]
    for p in packages:
        db.add(p)

    # === Inventory seed data ===

    # Sample ingredients with Cuban norms
    ingredients = [
        Ingredient(name="Huevo", category="Proteínas", unit="g",
                   norm_cuban_g=50, norm_european_g=60, norm_asian_g=50,
                   actual_portion_g=75, current_stock=5000, min_stock_alert=500,
                   unit_cost=0.004, supplier="Granja Local",
                   norm_source="NC (Norma Cubana)"),
        Ingredient(name="Arroz", category="Carbohidratos", unit="g",
                   norm_cuban_g=170, norm_european_g=150, norm_asian_g=200,
                   actual_portion_g=170, current_stock=50000, min_stock_alert=5000,
                   unit_cost=0.001, supplier="Distribuidora Nacional",
                   norm_source="NC (Norma Cubana)"),
        Ingredient(name="Pollo (pechuga)", category="Proteínas", unit="g",
                   norm_cuban_g=150, norm_european_g=150, norm_asian_g=130,
                   actual_portion_g=160, current_stock=15000, min_stock_alert=2000,
                   unit_cost=0.008, supplier="Avícola Central",
                   norm_source="NC (Norma Cubana)"),
        Ingredient(name="Cerdo", category="Proteínas", unit="g",
                   norm_cuban_g=200, norm_european_g=175, norm_asian_g=150,
                   actual_portion_g=200, current_stock=12000, min_stock_alert=2000,
                   unit_cost=0.007, supplier="Cárnica Provincial",
                   norm_source="NC (Norma Cubana)"),
        Ingredient(name="Frijoles negros", category="Carbohidratos", unit="g",
                   norm_cuban_g=180, norm_european_g=150, norm_asian_g=150,
                   actual_portion_g=180, current_stock=20000, min_stock_alert=3000,
                   unit_cost=0.002, supplier="Distribuidora Nacional",
                   norm_source="NC (Norma Cubana)"),
        Ingredient(name="Aceite vegetal", category="Ingredientes", unit="ml",
                   norm_cuban_g=15, norm_european_g=10, norm_asian_g=10,
                   actual_portion_g=15, current_stock=10000, min_stock_alert=1000,
                   unit_cost=0.003, supplier="Aceites del Caribe",
                   norm_source="NC (Norma Cubana)"),
        Ingredient(name="Cebolla", category="Ingredientes", unit="g",
                   norm_cuban_g=30, norm_european_g=30, norm_asian_g=30,
                   actual_portion_g=30, current_stock=8000, min_stock_alert=1000,
                   unit_cost=0.002, supplier="Mercado Agropecuario",
                   norm_source="NC (Norma Cubana)"),
        Ingredient(name="Tomate", category="Vegetales", unit="g",
                   norm_cuban_g=120, norm_european_g=120, norm_asian_g=100,
                   actual_portion_g=120, current_stock=6000, min_stock_alert=1000,
                   unit_cost=0.003, supplier="Mercado Agropecuario",
                   norm_source="NC (Norma Cubana)"),
        Ingredient(name="Yuca", category="Carbohidratos", unit="g",
                   norm_cuban_g=180, norm_european_g=None, norm_asian_g=None,
                   actual_portion_g=180, current_stock=10000, min_stock_alert=1500,
                   unit_cost=0.001, supplier="Mercado Agropecuario",
                   norm_source="NC (Norma Cubana)"),
        Ingredient(name="Plátano maduro", category="Carbohidratos", unit="g",
                   norm_cuban_g=120, norm_european_g=None, norm_asian_g=None,
                   actual_portion_g=120, current_stock=4000, min_stock_alert=800,
                   unit_cost=0.002, supplier="Mercado Agropecuario",
                   norm_source="NC (Norma Cubana)"),
    ]
    for ing in ingredients:
        db.add(ing)
    await db.flush()

    # Sample operating costs
    today = date.today()
    op_cost = OperatingCost(
        month=today.month,
        year=today.year,
        water_cost=200.0,
        electricity_cost=800.0,
        gas_cost=300.0,
        salary_cost=3000.0,
        rent_cost=1500.0,
        maintenance_cost=200.0,
        other_costs=500.0,
        notes="Costos operativos mensuales base",
    )
    db.add(op_cost)

    # Sample recipe: Arroz con pollo
    recipe = Recipe(
        name="Arroz con Pollo",
        category="Plato principal",
        description="Arroz amarillo con pollo, pimientos y guisantes",
        servings=1,
        preparation_time_min=45,
        profit_margin=30.0,
    )
    db.add(recipe)
    await db.flush()

    recipe_ings = [
        RecipeIngredient(recipe_id=recipe.id, ingredient_id=ingredients[2].id,
                         norm_quantity=150, actual_quantity=160, unit="g"),  # Pollo
        RecipeIngredient(recipe_id=recipe.id, ingredient_id=ingredients[1].id,
                         norm_quantity=170, actual_quantity=170, unit="g"),  # Arroz
        RecipeIngredient(recipe_id=recipe.id, ingredient_id=ingredients[5].id,
                         norm_quantity=15, actual_quantity=15, unit="ml"),  # Aceite
        RecipeIngredient(recipe_id=recipe.id, ingredient_id=ingredients[6].id,
                         norm_quantity=30, actual_quantity=30, unit="g"),  # Cebolla
    ]
    for ri in recipe_ings:
        db.add(ri)

    # Calculate recipe costs
    total_ing = (160 * 0.008) + (170 * 0.001) + (15 * 0.003) + (30 * 0.002)
    op_per_dish = op_cost.total / (30 * 30)
    total_cost = total_ing + op_per_dish
    recipe.ingredient_cost = round(total_ing, 2)
    recipe.operating_cost_share = round(op_per_dish, 2)
    recipe.total_cost = round(total_cost, 2)
    recipe.selling_price = round(total_cost * 1.30, 2)

    # Additional recipes for a complete menu
    extra_recipes = [
        Recipe(
            name="Ropa Vieja",
            category="Plato principal",
            description="Carne deshilachada en salsa criolla con arroz y frijoles",
            servings=1, preparation_time_min=60, profit_margin=30.0,
            ingredient_cost=3.20, operating_cost_share=round(op_per_dish, 2),
            total_cost=round(3.20 + op_per_dish, 2),
            selling_price=round((3.20 + op_per_dish) * 1.30, 2),
        ),
        Recipe(
            name="Lechón Asado",
            category="Plato principal",
            description="Cerdo asado con mojo, yuca con mojo y ensalada",
            servings=1, preparation_time_min=120, profit_margin=30.0,
            ingredient_cost=4.00, operating_cost_share=round(op_per_dish, 2),
            total_cost=round(4.00 + op_per_dish, 2),
            selling_price=round((4.00 + op_per_dish) * 1.30, 2),
        ),
        Recipe(
            name="Frijoles Negros",
            category="Acompañamiento",
            description="Frijoles negros guisados estilo cubano",
            servings=1, preparation_time_min=30, profit_margin=30.0,
            ingredient_cost=0.80, operating_cost_share=round(op_per_dish, 2),
            total_cost=round(0.80 + op_per_dish, 2),
            selling_price=round((0.80 + op_per_dish) * 1.30, 2),
        ),
        Recipe(
            name="Tostones",
            category="Acompañamiento",
            description="Plátano verde frito y aplastado",
            servings=1, preparation_time_min=15, profit_margin=30.0,
            ingredient_cost=0.50, operating_cost_share=round(op_per_dish, 2),
            total_cost=round(0.50 + op_per_dish, 2),
            selling_price=round((0.50 + op_per_dish) * 1.30, 2),
        ),
        Recipe(
            name="Mojito",
            category="Bebida",
            description="Cóctel cubano con ron, hierbabuena, limón y soda",
            servings=1, preparation_time_min=5, profit_margin=30.0,
            ingredient_cost=1.50, operating_cost_share=round(op_per_dish, 2),
            total_cost=round(1.50 + op_per_dish, 2),
            selling_price=round((1.50 + op_per_dish) * 1.30, 2),
        ),
        Recipe(
            name="Flan de Caramelo",
            category="Postre",
            description="Flan cubano tradicional con caramelo",
            servings=1, preparation_time_min=45, profit_margin=30.0,
            ingredient_cost=0.70, operating_cost_share=round(op_per_dish, 2),
            total_cost=round(0.70 + op_per_dish, 2),
            selling_price=round((0.70 + op_per_dish) * 1.30, 2),
        ),
        Recipe(
            name="Yuca con Mojo",
            category="Acompañamiento",
            description="Yuca hervida con salsa de ajo y naranja agria",
            servings=1, preparation_time_min=25, profit_margin=30.0,
            ingredient_cost=0.45, operating_cost_share=round(op_per_dish, 2),
            total_cost=round(0.45 + op_per_dish, 2),
            selling_price=round((0.45 + op_per_dish) * 1.30, 2),
        ),
        Recipe(
            name="Ensalada Mixta",
            category="Entrada",
            description="Ensalada fresca con tomate, lechuga, pepino y aguacate",
            servings=1, preparation_time_min=10, profit_margin=30.0,
            ingredient_cost=0.60, operating_cost_share=round(op_per_dish, 2),
            total_cost=round(0.60 + op_per_dish, 2),
            selling_price=round((0.60 + op_per_dish) * 1.30, 2),
        ),
    ]
    for r in extra_recipes:
        db.add(r)
    await db.flush()

    # Sample supplier
    from backend.suppliers import Supplier
    supplier = Supplier(
        name="Distribuidora Nacional de Alimentos",
        contact_person="Carlos Rodríguez",
        phone="+5352001234",
        email="distribuidora@empresa.cu",
        address="Calle 23 #456, Vedado, La Habana",
        notes="Proveedor principal de carnes y granos",
    )
    db.add(supplier)

    # Sample exchange rates
    from backend.currency import ExchangeRate
    from datetime import datetime
    for code, rate in [("USD", 300.0), ("EUR", 330.0), ("MLC", 250.0), ("CAD", 220.0), ("MXN", 15.0), ("GBP", 380.0)]:
        db.add(ExchangeRate(currency_code=code, rate_to_cup=rate, rate_date=today, updated_by="seed"))

    # Sample daily sales for predictions
    import random
    all_recipes = [recipe] + extra_recipes
    for i in range(30):
        d = date.today() - __import__('datetime').timedelta(days=30 - i)
        for r in all_recipes:
            base = 15 + (i // 10) * 2 if r.category == "Plato principal" else 8 + (i // 10)
            qty = max(1, base + random.randint(-5, 5))
            ds = DailySales(
                date=d,
                recipe_id=r.id,
                quantity_sold=qty,
                revenue=qty * r.selling_price,
                food_cost=qty * r.total_cost,
            )
            db.add(ds)

    await db.commit()

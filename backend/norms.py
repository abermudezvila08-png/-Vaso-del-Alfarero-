"""Food portion norms database.

Priority: Cuban norms (NC) > European (EFSA/Culinaria) > Asian (CODEX/national).
Each entry defines the standard portion in grams for a given ingredient
as used in restaurant/cafeteria service.
"""

from dataclasses import dataclass


@dataclass
class PortionNorm:
    ingredient: str
    category: str
    cuban_portion_g: float | None
    european_portion_g: float | None
    asian_portion_g: float | None
    unit: str = "g"
    notes: str = ""

    @property
    def effective_portion_g(self) -> float:
        """Return the portion using priority: Cuban > European > Asian."""
        if self.cuban_portion_g is not None:
            return self.cuban_portion_g
        if self.european_portion_g is not None:
            return self.european_portion_g
        if self.asian_portion_g is not None:
            return self.asian_portion_g
        return 100.0  # default fallback

    @property
    def norm_source(self) -> str:
        if self.cuban_portion_g is not None:
            return "NC (Norma Cubana)"
        if self.european_portion_g is not None:
            return "EU (Norma Europea)"
        if self.asian_portion_g is not None:
            return "ASIA (Norma Asiática)"
        return "Estándar (100g)"


# Comprehensive norms database based on Cuban gastronomic standards,
# European EFSA guidelines, and Asian CODEX references.
PORTION_NORMS: list[PortionNorm] = [
    # === PROTEÍNAS ===
    PortionNorm("Huevo frito", "Proteínas", 50, 60, 50, "g",
                "NC: 1 huevo estándar ~50g sin cáscara"),
    PortionNorm("Huevo hervido", "Proteínas", 50, 60, 50, "g",
                "NC: 1 huevo estándar"),
    PortionNorm("Huevo revuelto", "Proteínas", 100, 120, 100, "g",
                "NC: 2 huevos por porción"),
    PortionNorm("Tortilla de huevo", "Proteínas", 100, 120, 100, "g",
                "NC: 2 huevos + relleno"),
    PortionNorm("Bistec de res", "Proteínas", 150, 150, 120, "g",
                "NC: porción de carne limpia"),
    PortionNorm("Bistec de cerdo", "Proteínas", 150, 150, 120, "g",
                "NC: porción de carne limpia"),
    PortionNorm("Pollo asado (muslo)", "Proteínas", 180, 175, 150, "g",
                "NC: 1 pieza con hueso"),
    PortionNorm("Pollo frito", "Proteínas", 180, 175, 150, "g",
                "NC: 1 pieza con hueso"),
    PortionNorm("Pechuga de pollo", "Proteínas", 150, 150, 130, "g",
                "NC: pechuga deshuesada"),
    PortionNorm("Cerdo asado", "Proteínas", 200, 175, 150, "g",
                "NC: porción generosa tradicional"),
    PortionNorm("Masas de cerdo fritas", "Proteínas", 180, 150, 130, "g",
                "NC: porción estándar cubana"),
    PortionNorm("Ropa vieja", "Proteínas", 200, None, None, "g",
                "NC: plato tradicional cubano"),
    PortionNorm("Picadillo de res", "Proteínas", 180, None, None, "g",
                "NC: carne molida condimentada"),
    PortionNorm("Pescado frito (filete)", "Proteínas", 150, 150, 130, "g",
                "NC: filete limpio"),
    PortionNorm("Camarones", "Proteínas", 120, 130, 100, "g",
                "NC: camarones limpios sin cabeza"),
    PortionNorm("Langosta", "Proteínas", 150, 150, 130, "g",
                "NC: cola limpia"),

    # === ACOMPAÑAMIENTOS / CARBOHIDRATOS ===
    PortionNorm("Arroz blanco", "Carbohidratos", 170, 150, 200, "g",
                "NC: porción cocida estándar"),
    PortionNorm("Arroz congri", "Carbohidratos", 200, None, None, "g",
                "NC: arroz con frijoles negros"),
    PortionNorm("Arroz moros y cristianos", "Carbohidratos", 200, None, None, "g",
                "NC: arroz con frijoles colorados"),
    PortionNorm("Frijoles negros", "Carbohidratos", 180, 150, 150, "g",
                "NC: porción de potaje"),
    PortionNorm("Frijoles colorados", "Carbohidratos", 180, 150, 150, "g",
                "NC: porción de potaje"),
    PortionNorm("Papa (puré)", "Carbohidratos", 150, 150, 130, "g",
                "NC: puré de papa"),
    PortionNorm("Papa frita", "Carbohidratos", 150, 150, 130, "g",
                "NC: papas fritas como guarnición"),
    PortionNorm("Yuca hervida", "Carbohidratos", 180, None, None, "g",
                "NC: vianda tradicional"),
    PortionNorm("Yuca frita", "Carbohidratos", 150, None, None, "g",
                "NC: vianda frita"),
    PortionNorm("Plátano maduro frito", "Carbohidratos", 120, None, None, "g",
                "NC: maduros/tostones"),
    PortionNorm("Tostones", "Carbohidratos", 120, None, None, "g",
                "NC: plátano verde frito"),
    PortionNorm("Boniato hervido", "Carbohidratos", 180, None, None, "g",
                "NC: vianda"),
    PortionNorm("Pan", "Carbohidratos", 60, 50, 40, "g",
                "NC: pan de flauta/redondo"),
    PortionNorm("Pasta (espaguetis)", "Carbohidratos", 200, 180, 200, "g",
                "NC: porción cocida"),

    # === ENSALADAS Y VEGETALES ===
    PortionNorm("Ensalada mixta", "Vegetales", 150, 150, 120, "g",
                "NC: lechuga, tomate, pepino"),
    PortionNorm("Ensalada de tomate", "Vegetales", 120, 120, 100, "g",
                "NC: tomate en rodajas"),
    PortionNorm("Ensalada de col", "Vegetales", 100, 100, 80, "g",
                "NC: col rallada"),
    PortionNorm("Ensalada de pepino", "Vegetales", 100, 100, 80, "g",
                "NC: pepino en rodajas"),
    PortionNorm("Aguacate", "Vegetales", 80, 80, 60, "g",
                "NC: media porción"),
    PortionNorm("Vegetales salteados", "Vegetales", 150, 150, 200, "g",
                "EU/Asia: porción de vegetales cocidos"),

    # === SOPAS Y CREMAS ===
    PortionNorm("Sopa de pollo", "Sopas", 250, 250, 250, "ml",
                "NC: taza estándar"),
    PortionNorm("Sopa de vegetales", "Sopas", 250, 250, 250, "ml",
                "NC: taza estándar"),
    PortionNorm("Crema de frijoles", "Sopas", 200, 200, 200, "ml",
                "NC: crema"),
    PortionNorm("Ajiaco", "Sopas", 350, None, None, "ml",
                "NC: sopa espesa cubana"),
    PortionNorm("Caldo", "Sopas", 250, 250, 250, "ml",
                "NC: caldo claro"),

    # === POSTRES ===
    PortionNorm("Flan de huevo", "Postres", 120, 120, 100, "g",
                "NC: porción individual"),
    PortionNorm("Helado", "Postres", 100, 100, 80, "g",
                "NC: 2 bolas"),
    PortionNorm("Arroz con leche", "Postres", 150, None, None, "g",
                "NC: postre cubano"),
    PortionNorm("Dulce de coco", "Postres", 80, None, None, "g",
                "NC: porción de dulce"),
    PortionNorm("Fruta fresca", "Postres", 150, 150, 130, "g",
                "NC: porción de fruta"),
    PortionNorm("Cake/Pastel", "Postres", 100, 100, 80, "g",
                "EU: porción estándar"),

    # === BEBIDAS ===
    PortionNorm("Café expreso", "Bebidas", 30, 30, 30, "ml",
                "NC: taza de café cubano"),
    PortionNorm("Café con leche", "Bebidas", 200, 200, 200, "ml",
                "NC: taza"),
    PortionNorm("Jugo natural", "Bebidas", 250, 200, 200, "ml",
                "NC: vaso estándar"),
    PortionNorm("Refresco", "Bebidas", 350, 330, 350, "ml",
                "NC: lata/vaso"),
    PortionNorm("Agua", "Bebidas", 500, 500, 500, "ml",
                "Estándar: botella individual"),
    PortionNorm("Cerveza", "Bebidas", 350, 330, 330, "ml",
                "NC: botella/lata"),

    # === CONDIMENTOS / SALSAS ===
    PortionNorm("Salsa criolla", "Salsas", 30, None, None, "g",
                "NC: sofrito cubano"),
    PortionNorm("Mojo criollo", "Salsas", 20, None, None, "ml",
                "NC: salsa de ajo y naranja agria"),
    PortionNorm("Salsa de tomate", "Salsas", 30, 30, 20, "g",
                "NC: acompañamiento"),
    PortionNorm("Aceite", "Salsas", 15, 10, 10, "ml",
                "NC: por plato"),

    # === INGREDIENTES BASE (para recetas) ===
    PortionNorm("Aceite vegetal", "Ingredientes", 15, 10, 10, "ml",
                "Por porción en preparación"),
    PortionNorm("Sal", "Ingredientes", 3, 5, 3, "g",
                "Por porción"),
    PortionNorm("Ajo", "Ingredientes", 5, 5, 5, "g",
                "Por porción"),
    PortionNorm("Cebolla", "Ingredientes", 30, 30, 30, "g",
                "Por porción"),
    PortionNorm("Pimiento", "Ingredientes", 20, 20, 20, "g",
                "Por porción"),
    PortionNorm("Limón", "Ingredientes", 15, 15, 15, "ml",
                "Jugo por porción"),
]


def get_norm(ingredient_name: str) -> PortionNorm | None:
    """Find a portion norm by ingredient name (case-insensitive partial match)."""
    lower = ingredient_name.lower()
    for norm in PORTION_NORMS:
        if lower in norm.ingredient.lower() or norm.ingredient.lower() in lower:
            return norm
    return None


def get_norms_by_category(category: str) -> list[PortionNorm]:
    """Get all norms for a given category."""
    return [n for n in PORTION_NORMS if n.category.lower() == category.lower()]


def get_all_categories() -> list[str]:
    """Get all unique categories."""
    return sorted(set(n.category for n in PORTION_NORMS))


def calculate_adjusted_price(
    norm_portion_g: float,
    actual_portion_g: float,
    base_cost_per_unit: float,
) -> dict:
    """Calculate price adjustment when actual ingredient differs from norm.

    Example: if norm says egg = 50g but our eggs are 75g,
    we use 75/50 = 1.5x the norm, so cost is 1.5x the base.
    """
    ratio = actual_portion_g / norm_portion_g if norm_portion_g > 0 else 1.0
    adjusted_cost = base_cost_per_unit * ratio
    return {
        "norm_portion_g": norm_portion_g,
        "actual_portion_g": actual_portion_g,
        "ratio": round(ratio, 4),
        "base_cost": round(base_cost_per_unit, 2),
        "adjusted_cost": round(adjusted_cost, 2),
        "difference_pct": round((ratio - 1) * 100, 1),
    }

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const zod_1 = require("zod");
const logger_1 = __importDefault(require("../config/logger"));
const router = (0, express_1.Router)();
// Ingredient schema for validation
const ingredientSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    quantity: zod_1.z.string().min(1),
    unit: zod_1.z.string().min(1),
    location: zod_1.z.string().min(1),
});
// GET /ingredients - List user's ingredients
router.get('/', auth_1.authenticateToken, async (req, res) => {
    const supabase = req.supabase;
    const userId = req.user?.userId;
    try {
        const { data, error } = await supabase
            .from('user_ingredients')
            .select('id, ingredient_id, quantity, unit, location, expiry_date, created_at, updated_at, ingredients(name)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) {
            logger_1.default.error('Error fetching ingredients:', error);
            return res.status(500).json({ error: 'Failed to fetch ingredients' });
        }
        // Flatten ingredient name
        const result = data.map((row) => ({
            id: row.id,
            name: row.ingredients?.name || '',
            quantity: row.quantity,
            unit: row.unit,
            location: row.location,
            expiry_date: row.expiry_date,
            created_at: row.created_at,
            updated_at: row.updated_at,
        }));
        res.json(result);
    }
    catch (err) {
        logger_1.default.error('Error in GET /ingredients:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /ingredients - Add ingredient
router.post('/', auth_1.authenticateToken, async (req, res) => {
    const supabase = req.supabase;
    const userId = req.user?.userId;
    try {
        const parsed = ingredientSchema.parse(req.body);
        // Find or create ingredient in ingredients table
        let { data: ingredient, error: findError } = await supabase
            .from('ingredients')
            .select('id')
            .eq('name', parsed.name)
            .single();
        if (findError && findError.code !== 'PGRST116') {
            logger_1.default.error('Error finding ingredient:', findError);
            return res.status(500).json({ error: 'Failed to find ingredient' });
        }
        if (!ingredient) {
            // Create new ingredient
            const { data: newIngredient, error: createError } = await supabase
                .from('ingredients')
                .insert({ name: parsed.name })
                .select('id')
                .single();
            if (createError) {
                logger_1.default.error('Error creating ingredient:', createError);
                return res.status(500).json({ error: 'Failed to create ingredient' });
            }
            ingredient = newIngredient;
        }
        // Add to user_ingredients
        const { data: userIngredient, error: addError } = await supabase
            .from('user_ingredients')
            .insert({
            user_id: userId,
            ingredient_id: ingredient.id,
            quantity: parsed.quantity,
            unit: parsed.unit,
            location: parsed.location,
        })
            .select('*')
            .single();
        if (addError) {
            logger_1.default.error('Error adding user ingredient:', addError);
            return res.status(500).json({ error: 'Failed to add ingredient' });
        }
        res.status(201).json(userIngredient);
    }
    catch (err) {
        if (err instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: err.errors });
        }
        logger_1.default.error('Error in POST /ingredients:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /ingredients/:id - Remove ingredient
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    const supabase = req.supabase;
    const userId = req.user?.userId;
    const { id } = req.params;
    try {
        // Only delete if the ingredient belongs to the user
        const { data, error } = await supabase
            .from('user_ingredients')
            .delete()
            .eq('id', id)
            .eq('user_id', userId)
            .select();
        if (error) {
            logger_1.default.error('Error deleting ingredient:', error);
            return res.status(500).json({ error: 'Failed to delete ingredient' });
        }
        if (!data || data.length === 0) {
            return res.status(404).json({ error: 'Ingredient not found' });
        }
        res.json({ message: 'Ingredient removed' });
    }
    catch (err) {
        logger_1.default.error('Error in DELETE /ingredients/:id:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=ingredients.js.map
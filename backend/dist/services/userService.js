"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findOrCreateUserByGoogle = findOrCreateUserByGoogle;
exports.findUserById = findUserById;
const supabase_js_1 = require("@supabase/supabase-js");
const env_1 = require("../config/env");
const supabase = (0, supabase_js_1.createClient)(env_1.env.SUPABASE_URL, env_1.env.SUPABASE_SERVICE_ROLE_KEY);
async function findOrCreateUserByGoogle(profile) {
    // Try to find user by Google ID or email
    const { data: existingUser, error: findError } = await supabase
        .from('users')
        .select('*')
        .or(`google_id.eq.${profile.id},email.eq.${profile.emails?.[0]?.value}`)
        .single();
    if (findError && findError.code !== 'PGRST116') {
        throw findError;
    }
    if (existingUser) {
        // If user exists, update Google ID if missing
        if (!existingUser.google_id) {
            await supabase
                .from('users')
                .update({ google_id: profile.id })
                .eq('id', existingUser.id);
        }
        return existingUser;
    }
    // Create new user
    const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
        email: profile.emails?.[0]?.value,
        name: profile.displayName,
        google_id: profile.id,
        // Add other fields as needed
    })
        .select('*')
        .single();
    if (createError)
        throw createError;
    return newUser;
}
async function findUserById(id) {
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
    if (error)
        throw error;
    return user;
}
//# sourceMappingURL=userService.js.map
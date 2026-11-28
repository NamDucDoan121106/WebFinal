export const publicUserSelect = {
    id: true,
    email: true,
    display_name: true,
    avatar_url: true,
    is_verified: true,
    created_at: true,
    updated_at: true,

    preferences: {
        select: {
            font_size: true,
            theme: true,
            default_note_color: true,
            view_mode: true
        }
    }
};

export function sanitizeUser(user) {
    const {
        password_hash,
        verify_token,
        token_version,
        ...safeUser
    } = user;

    return safeUser;
}
import {
    useEffect,
    useState
} from "react";

import { Link } from "react-router-dom";

import {
    useAuth
} from "../auth/AuthContext.jsx";

import {
    userApi
} from "../api/user.api.js";

import Avatar from "./Avatar.jsx";

import "./account.css";

const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
];

const maxFileSize = 2 * 1024 * 1024;

function ProfileForm({ user, refresh }) {
    const [name, setName] =
        useState(user.display_name);

    const [avatarFile, setAvatarFile] =
        useState(null);

    const [preview, setPreview] = useState("");

    const [error, setError] = useState("");

    const [message, setMessage] = useState("");

    const [loading, setLoading] = useState(false);

    const [inputVersion, setInputVersion] =
        useState(0);

    useEffect(() => {
        if (!avatarFile) {
            setPreview("");
            return;
        }

        const objectUrl =
            URL.createObjectURL(avatarFile);

        setPreview(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };

    }, [avatarFile]);

    function handleFileChange(event) {
        const file = event.target.files?.[0];

        setError("");
        setMessage("");

        if (!file) return;

        if (!allowedTypes.includes(file.type)) {
            setError(
                "Only JPG, PNG and WebP images are allowed."
            );

            setAvatarFile(null);
            event.target.value = "";

            return;
        }

        if (file.size > maxFileSize) {
            setError(
                "Avatar must not exceed 2 MB."
            );

            setAvatarFile(null);
            event.target.value = "";

            return;
        }

        setAvatarFile(file);
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (loading) return;

        setError("");
        setMessage("");
        setLoading(true);

        try {
            const formData = new FormData();

            formData.append(
                "display_name",
                name.trim()
            );

            if (avatarFile) {
                formData.append(
                    "avatar",
                    avatarFile
                );
            }

            const response =
                await userApi.updateProfile(
                    formData
                );

            setName(
                response.data.data.display_name
            );

            await refresh();

            setAvatarFile(null);

            setInputVersion(value => value + 1);

            setMessage(response.data.message);

        } catch (err) {
            setError(
                err.response?.data?.message ||
                "Unable to update your profile."
            );

        } finally {
            setLoading(false);
        }
    }

    return (
        <section className="account-card">

            <h1>My profile</h1>

            <p className="account-muted">
                View and manage your personal information.
            </p>

            {error && (
                <div
                    className="auth-error"
                    role="alert"
                >
                    {error}
                </div>
            )}

            {message && (
                <div
                    className="auth-success"
                    role="status"
                >
                    {message}
                </div>
            )}

            <form
                className="account-form"
                onSubmit={handleSubmit}
            >

                <div className="profile-avatar-area">

                    <Avatar
                        src={preview || user.avatar_url}
                        name={name}
                        size={112}
                    />

                    <div>
                        <label htmlFor="avatar">
                            Profile photo
                        </label>

                        <input
                            key={inputVersion}
                            id="avatar"
                            name="avatar"
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleFileChange}
                            disabled={loading}
                        />

                        <small className="account-muted">
                            JPG, PNG or WebP. Maximum 2 MB.
                        </small>
                    </div>

                </div>

                <div className="account-field">

                    <label htmlFor="profile-email">
                        Email address
                    </label>

                    <input
                        id="profile-email"
                        value={user.email}
                        type="email"
                        readOnly
                    />

                    <small className="account-muted">
                        {user.is_verified
                            ? "Email verified"
                            : "Email not verified"}
                    </small>

                </div>

                <div className="account-field">

                    <label htmlFor="profile-name">
                        Display name
                    </label>

                    <input
                        id="profile-name"
                        value={name}
                        onChange={event =>
                            setName(event.target.value)
                        }
                        minLength={2}
                        maxLength={100}
                        required
                        disabled={loading}
                    />

                </div>

                <button
                    className="account-primary"
                    disabled={loading}
                    type="submit"
                >
                    {loading
                        ? "Saving..."
                        : "Update profile"}
                </button>

            </form>

            <div className="account-links">

                <Link to="/change-password">
                    Change password
                </Link>

                <Link to="/preferences">
                    Preferences
                </Link>

                <Link to="/">
                    Back to notes
                </Link>

            </div>

        </section>
    );
}

export default function ProfilePage() {
    const { user, refresh } = useAuth();

    return (
        <main className="account-page">

            {user && (
                <ProfileForm
                    key={user.id}
                    user={user}
                    refresh={refresh}
                />
            )}

        </main>
    );
}
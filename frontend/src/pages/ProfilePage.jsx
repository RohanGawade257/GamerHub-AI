import { useEffect, useState } from "react";

import api from "../api";
import { useAuth } from "../context/AuthContext";

function createEmptySocialLink() {
  return {
    platform: "",
    label: "",
    url: "",
  };
}

function mapUserToFormState(profile) {
  const normalizedPreferredSports = Array.isArray(profile?.preferredSports)
    ? profile.preferredSports.join(", ")
    : String(profile?.preferredSports || "");

  return {
    name: profile?.name || "",
    email: profile?.email || "",
    age: profile?.age === null || profile?.age === undefined ? "" : String(profile.age),
    phone: profile?.phone || "",
    location: profile?.location || "",
    skillLevel: String(profile?.skillLevel || 3),
    preferredSports: normalizedPreferredSports,
    password: "",
    profileImage: profile?.profileImage || "",
    bio: profile?.bio || "",
    socialLinks: Array.isArray(profile?.socialLinks) && profile.socialLinks.length > 0
      ? profile.socialLinks.map((link) => ({
          platform: link.platform || "",
          label: link.label || "",
          url: link.url || "",
        }))
      : [createEmptySocialLink()],
  };
}

const INPUT_CLASSNAME = "w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400";

function ProfilePage() {
  const { user, fetchCurrentUser, logout } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    age: "",
    phone: "",
    location: "",
    skillLevel: "3",
    preferredSports: "",
    password: "",
    profileImage: "",
    bio: "",
    socialLinks: [createEmptySocialLink()],
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (!saved) {
      return;
    }

    try {
      const parsedProfile = JSON.parse(saved);
      setForm(mapUserToFormState(parsedProfile));
    } catch {
      // Ignore malformed local user cache
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        const response = await api.get("/user/profile");
        const profile = response?.data?.user || null;
        if (!profile || !mounted) {
          return;
        }

        setForm(mapUserToFormState(profile));
        localStorage.setItem("user", JSON.stringify(profile));
      } catch {
        // Keep local cache/state as fallback when request fails.
      }
    };

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    setForm(mapUserToFormState(user));
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSaving(true);

    try {
      const payload = {
        age: Number(form.age),
        phone: form.phone || "",
        preferredSports: form.preferredSports || "",
        location: form.location,
        bio: form.bio,
        profileImage: form.profileImage,
        socialLinks: form.socialLinks
          .map((link) => ({
            platform: String(link.platform || "").trim(),
            label: String(link.label || "").trim(),
            url: String(link.url || "").trim(),
          }))
          .filter((link) => link.platform && link.label && link.url),
      };

      const response = await api.put("/user/profile", payload);
      const updatedUser = response?.data?.user || null;

      if (updatedUser) {
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setForm(mapUserToFormState(updatedUser));
      } else {
        setForm((currentForm) => ({ ...currentForm, password: "" }));
      }

      try {
        await fetchCurrentUser();
      } catch {
        // Local profile state was already updated above.
      }

      setSuccess("Profile updated successfully");
    } catch (requestError) {
      setError(requestError?.response?.data?.error || "Unable to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({
        ...current,
        profileImage: typeof reader.result === "string" ? reader.result : "",
      }));
    };
    reader.readAsDataURL(file);
  };

  const updateSocialLinkField = (index, field, value) => {
    setForm((current) => ({
      ...current,
      socialLinks: current.socialLinks.map((link, linkIndex) => {
        if (linkIndex !== index) {
          return link;
        }

        return {
          ...link,
          [field]: value,
        };
      }),
    }));
  };

  const addSocialLink = () => {
    setForm((current) => ({
      ...current,
      socialLinks: [...current.socialLinks, createEmptySocialLink()],
    }));
  };

  const removeSocialLink = (index) => {
    setForm((current) => {
      const nextLinks = current.socialLinks.filter((_, linkIndex) => linkIndex !== index);
      return {
        ...current,
        socialLinks: nextLinks.length ? nextLinks : [createEmptySocialLink()],
      };
    });
  };

  return (
    <section className="mx-auto max-w-4xl rounded-2xl border border-white/60 bg-gradient-to-br from-white/90 via-blue-50/70 to-cyan-100/70 p-6 text-gray-900 shadow-2xl shadow-blue-100/30 transition-all duration-300 dark:border-zinc-700 dark:bg-gradient-to-br dark:from-zinc-900/95 dark:via-zinc-900 dark:to-indigo-950/50 dark:text-gray-100 dark:shadow-cyan-950/20">
      <h1 className="text-3xl font-black tracking-tight">Player Profile</h1>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Manage your profile, squad identity, and social links.</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/20 dark:text-indigo-200">
          Skill {form.skillLevel}
        </span>
        <span className="rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:border-cyan-500/40 dark:bg-cyan-500/20 dark:text-cyan-200">
          Sports {(form.preferredSports.split(",").map((sport) => sport.trim()).filter(Boolean)).length}
        </span>
        <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-500/20 dark:text-emerald-200">
          Socials {form.socialLinks.filter((link) => link.platform && link.label && link.url).length}
        </span>
      </div>

      <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
        <div className="md:col-span-2 flex items-center gap-4 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900/70">
          <div className="rounded-full bg-gradient-to-r from-indigo-600 to-cyan-500 p-1 shadow-[0_0_20px_rgba(56,189,248,.35)]">
            {form.profileImage ? (
              <img src={form.profileImage} alt="Profile" className="h-20 w-20 rounded-full border-2 border-white object-cover dark:border-zinc-900" />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-xl font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-100">
                {String(form.name || "P").slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className={INPUT_CLASSNAME}
          />
        </div>

        <input
          className={INPUT_CLASSNAME}
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Name"
          required
        />

        <input
          className={INPUT_CLASSNAME}
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
          required
        />

        <input
          className={INPUT_CLASSNAME}
          type="number"
          name="age"
          min="1"
          max="120"
          value={form.age}
          onChange={handleChange}
          placeholder="Age"
          required
        />

        <input
          className={INPUT_CLASSNAME}
          type="tel"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="Phone"
        />

        <input
          className={INPUT_CLASSNAME}
          type="text"
          name="location"
          value={form.location}
          onChange={handleChange}
          placeholder="Location"
          required
        />

        <select
          className={INPUT_CLASSNAME}
          name="skillLevel"
          value={form.skillLevel}
          onChange={handleChange}
        >
          <option value="1">1 - Beginner</option>
          <option value="2">2 - Casual</option>
          <option value="3">3 - Intermediate</option>
          <option value="4">4 - Advanced</option>
          <option value="5">5 - Competitive</option>
        </select>

        <input
          className={INPUT_CLASSNAME}
          type="password"
          name="password"
          value={form.password}
          onChange={handleChange}
          placeholder="New password (optional)"
          minLength={8}
        />

        <input
          className={`${INPUT_CLASSNAME} md:col-span-2`}
          type="text"
          name="preferredSports"
          value={form.preferredSports}
          onChange={handleChange}
          placeholder="Preferred sports (comma separated)"
        />

        <textarea
          className={`${INPUT_CLASSNAME} md:col-span-2`}
          rows={3}
          name="bio"
          value={form.bio}
          onChange={handleChange}
          placeholder="Bio"
        />

        <div className="space-y-2 md:col-span-2 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900/70">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Social Links</h2>
            <button
              type="button"
              onClick={addSocialLink}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-2 font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:scale-105"
            >
              Add Link
            </button>
          </div>

          {form.socialLinks.map((link, index) => (
            <div key={`social-${index}`} className="grid gap-2 rounded-xl border border-gray-200 bg-white/70 p-3 md:grid-cols-[1fr_1fr_2fr_auto] dark:border-zinc-700 dark:bg-zinc-800/80">
              <input
                type="text"
                className={INPUT_CLASSNAME}
                placeholder="Platform"
                value={link.platform}
                onChange={(event) => updateSocialLinkField(index, "platform", event.target.value)}
              />
              <input
                type="text"
                className={INPUT_CLASSNAME}
                placeholder="Display text"
                value={link.label}
                onChange={(event) => updateSocialLinkField(index, "label", event.target.value)}
              />
              <input
                type="url"
                className={INPUT_CLASSNAME}
                placeholder="https://..."
                value={link.url}
                onChange={(event) => updateSocialLinkField(index, "url", event.target.value)}
              />
              <button
                type="button"
                onClick={() => removeSocialLink(index)}
                className="rounded-xl border border-white/60 bg-white/85 px-4 py-2 font-semibold text-gray-900 transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:bg-white dark:border-zinc-700 dark:bg-zinc-700 dark:text-gray-100 dark:hover:bg-zinc-600"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {error ? <p className="md:col-span-2 text-sm text-red-600">{error}</p> : null}
        {success ? <p className="md:col-span-2 text-sm text-green-600">{success}</p> : null}

        <div className="md:col-span-2 flex flex-wrap items-center gap-2">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 py-2.5 font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:scale-105"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={logout}
            className="rounded-xl border border-white/60 bg-white/85 px-4 py-2 font-semibold text-gray-900 transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:bg-white dark:border-zinc-700 dark:bg-zinc-700 dark:text-gray-100 dark:hover:bg-zinc-600"
          >
            Logout
          </button>
        </div>
      </form>

      <div className="mt-6 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900/70">
        <h2 className="text-lg font-bold">Public Profile Preview</h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{form.bio || "No bio provided."}</p>

        {form.socialLinks.some((link) => link.platform && link.label && link.url) ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {form.socialLinks
              .filter((link) => link.platform && link.label && link.url)
              .map((link, index) => (
                <a
                  key={`${link.url}-${index}`}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-2 font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:scale-105"
                >
                  {link.platform}: {link.label}
                </a>
              ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default ProfilePage;

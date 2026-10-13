"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

export default function ProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [infoForm, setInfoForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    username: "",
  });
  const [infoSaving, setInfoSaving] = useState(false);
  const [infoMsg, setInfoMsg] = useState("");

  const [pwForm, setPwForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState("");

  function handle401(res) {
    if (res.status === 401) {
      router.push("/login");
      return true;
    }
    return false;
  }

  async function loadMe() {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/auth/me");
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load profile");
      setMe(data.user);
      setInfoForm({
        full_name: data.user.full_name || "",
        email: data.user.email || "",
        phone: data.user.phone || "",
        username: data.user.username || "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMe();
  }, []); // eslint-disable-line

  async function saveInfo(e) {
    e.preventDefault();
    setInfoSaving(true);
    setInfoMsg("");
    setError("");
    try {
      const res = await fetchWithAuth("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify(infoForm),
      });
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save");
        return;
      }
      setMe(data.user);
      setInfoMsg("Profile updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setInfoSaving(false);
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    setPwMsg("");
    setPwError("");
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwError("New password and confirmation don't match");
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetchWithAuth("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify({
          current_password: pwForm.current_password,
          new_password: pwForm.new_password,
        }),
      });
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) {
        setPwError(data.error || "Failed to change password");
        return;
      }
      setPwMsg("Password changed.");
      setPwForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwSaving(false);
    }
  }

  if (loading)
    return <div className="p-6 text-sm text-gray-500">Loading...</div>;
  if (error && !me)
    return <div className="p-6 text-sm text-red-600">{error}</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">
          {me?.role} {me?.branch ? `· ${me.branch.name}` : ""}
        </p>
      </div>

      <form onSubmit={saveInfo} className="border rounded-lg p-5 space-y-3">
        <h2 className="font-medium">Account info</h2>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {infoMsg && <p className="text-green-600 text-sm">{infoMsg}</p>}

        <div>
          <label className="text-xs text-gray-500 block mb-1">Full name</label>
          <input
            required
            value={infoForm.full_name}
            onChange={(e) =>
              setInfoForm({ ...infoForm, full_name: e.target.value })
            }
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Email</label>
          <input
            type="email"
            value={infoForm.email}
            onChange={(e) =>
              setInfoForm({ ...infoForm, email: e.target.value })
            }
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Phone</label>
          <input
            value={infoForm.phone}
            onChange={(e) =>
              setInfoForm({ ...infoForm, phone: e.target.value })
            }
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Username</label>
          <input
            value={infoForm.username}
            onChange={(e) =>
              setInfoForm({ ...infoForm, username: e.target.value })
            }
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={infoSaving}
            className="px-4 py-2 text-sm rounded-md bg-black text-white disabled:opacity-50"
          >
            {infoSaving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>

      <form onSubmit={savePassword} className="border rounded-lg p-5 space-y-3">
        <h2 className="font-medium">Change password</h2>
        {pwError && <p className="text-red-600 text-sm">{pwError}</p>}
        {pwMsg && <p className="text-green-600 text-sm">{pwMsg}</p>}

        <div>
          <label className="text-xs text-gray-500 block mb-1">
            Current password
          </label>
          <input
            required
            type="password"
            value={pwForm.current_password}
            onChange={(e) =>
              setPwForm({ ...pwForm, current_password: e.target.value })
            }
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">
            New password
          </label>
          <input
            required
            type="password"
            minLength={8}
            value={pwForm.new_password}
            onChange={(e) =>
              setPwForm({ ...pwForm, new_password: e.target.value })
            }
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">
            Confirm new password
          </label>
          <input
            required
            type="password"
            minLength={8}
            value={pwForm.confirm_password}
            onChange={(e) =>
              setPwForm({ ...pwForm, confirm_password: e.target.value })
            }
            className="w-full border rounded-md px-3 py-2 text-sm"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={pwSaving}
            className="px-4 py-2 text-sm rounded-md bg-black text-white disabled:opacity-50"
          >
            {pwSaving ? "Saving..." : "Change password"}
          </button>
        </div>
      </form>
    </div>
  );
}

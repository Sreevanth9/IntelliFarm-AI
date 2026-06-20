import { useState } from "react";
import toast from "react-hot-toast";

import Navbar from "../components/Navbar";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [error, setError] = useState("");

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const submitHandler = (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError("Please fill all fields before sending.");
      toast.error("Please complete the contact form");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Please enter a valid email address.");
      toast.error("Invalid email address");
      return;
    }
    setError("");
    toast.success("Message saved for demo follow-up");
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <main className="ag-page">
      <Navbar />
      <section className="home-section">
        <p className="ag-eyebrow">Contact</p>
        <h1>Reach IntelliFarm AI support.</h1>
        <p>For project demos, farmer onboarding, and platform questions:</p>
        <form className="ag-contact-form" onSubmit={submitHandler}>
          <input name="name" value={form.name} onChange={updateField} placeholder="Your name" />
          <input name="email" value={form.email} onChange={updateField} placeholder="Email address" />
          <textarea name="message" value={form.message} onChange={updateField} placeholder="Message" rows="5" />
          {error && <p className="ag-error">{error}</p>}
          <button type="submit">Send Message</button>
        </form>
      </section>
    </main>
  );
};

export default Contact;

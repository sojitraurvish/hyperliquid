"use client";

import { useState } from "react";
import AppButton from "@/components/ui/button";
import { VARIANT_TYPES } from "@/lib/constants";
import { appToast } from "@/components/ui/toast";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  subject: string;
  message: string;
}

export const ContactForm = () => {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    subject: "general",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.message) {
      appToast.error({ message: "Please fill in all required fields" });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      appToast.error({ message: "Please enter a valid email address" });
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Show success toast
      appToast.success({ message: "Your message has been sent successfully! We'll get back to you soon." });
      
      // Reset form
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        company: "",
        subject: "general",
        message: "",
      });
    } catch (error) {
      appToast.error({ message: "Failed to send message. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-900/30 backdrop-blur-sm rounded-2xl sm:rounded-3xl border border-gray-800/50 p-5 sm:p-8">
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 tracking-tight">
        Send Us a Message
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* First Name and Last Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="John"
              required
              className="w-full px-4 py-3 bg-gray-800/40 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500/30 transition-all"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Doe"
              required
              className="w-full px-4 py-3 bg-gray-800/40 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500/30 transition-all"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john@example.com"
            required
            className="w-full px-4 py-3 bg-gray-800/40 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500/30 transition-all"
          />
        </div>

        {/* Company (Optional) */}
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-300 mb-2">
            Company <span className="text-gray-500">(optional)</span>
          </label>
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company}
            onChange={handleChange}
            placeholder="Your company"
            className="w-full px-4 py-3 bg-gray-800/40 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500/30 transition-all"
          />
        </div>

        {/* Subject */}
        <div>
          <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
            Subject
          </label>
          <select
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gray-800/40 border border-gray-700/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500/30 transition-all"
          >
            <option value="general">General Inquiry</option>
            <option value="support">Technical Support</option>
            <option value="partnership">Partnership</option>
            <option value="media">Media Inquiry</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="How can we help you?"
            required
            rows={6}
            className="w-full px-4 py-3 bg-gray-800/40 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500/30 transition-all resize-none"
          />
        </div>

        {/* Submit Button */}
        <AppButton
          type="submit"
          variant={VARIANT_TYPES.NOT_SELECTED}
          className="w-full bg-green-500 hover:bg-green-400 text-white px-6 py-3.5 text-base font-semibold rounded-xl transition-all shadow-[0_0_25px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.35)] disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
          isLoading={isSubmitting}
        >
          {isSubmitting ? "Sending..." : "Send Message"}
        </AppButton>
      </form>
    </div>
  );
};





import React from "react";
import "./Login.css";

export default function Login({ url }: { url: string }) {
  return (
    <div className="login-page">
      <h1>Syllabus to Calendar</h1>
      <p>
        A simple way to extract assignment schedules from your course syllabus.
        Sign in to your Google Account to get started!
      </p>
      <a href={`${url}/auth/google`} className="sign-in">
        Sign in
      </a>
      <footer>
        <a className="privacy-policy" href="/policy">
          Privacy Policy
        </a>
      </footer>
    </div>
  );
}

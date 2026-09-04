import React, { useState } from "react";
import useLogin from "../hooks/useLogin.js";
import styles from "./LoginForm.module.css";

export const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const loginMutation = useLogin();

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    loginMutation.mutate({
      email,
      password,
    });
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <aside className={styles.leftPanel}>
          <img
            className={styles.heroImage}
            src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1400&q=80"
            alt="Stylish fine dining restaurant interior"
          />
        </aside>

        <section className={styles.rightPanel}>
          <div className={styles.formWrap}>
            <p className={styles.brand}>OrangeRSVP</p>
            <h2>Welcome back</h2>
            <p className={styles.subtitle}>
              Log in to manage your restaurant reservations.
            </p>

            <form className={styles.form} onSubmit={handleSubmit}>
              <label className={styles.field}>
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </label>

              <label className={styles.field}>
                <span>Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </label>

              <button
                className={styles.submitButton}
                type="submit"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Logging in..." : "Log in"}
              </button>

              {loginMutation.isError && (
                <p className={styles.errorText}>Invalid email or password</p>
              )}
            </form>
          </div>
        </section>
      </section>
    </main>
  );
};

export default LoginForm;

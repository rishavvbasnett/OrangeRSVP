import styles from "./NotFound.module.css";

const NotFound = () => (
  <main className={styles.page}>
    <section className={styles.content}>
      <p className={styles.code}>404</p>
      <h1>Page not found</h1>
      <p className={styles.message}>
        The page you are looking for does not exist.
      </p>
      <a className={styles.link} href="/login">
        Return to login
      </a>
    </section>
  </main>
);

export default NotFound;

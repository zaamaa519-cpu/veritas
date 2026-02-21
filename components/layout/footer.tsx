export default function Footer() {
  return (
    <footer className="w-full border-t border-border/40 py-6">
      <div className="container flex items-center justify-center text-center">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Veritas AI. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

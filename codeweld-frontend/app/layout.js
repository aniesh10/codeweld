import "./globals.css";

export const metadata = {
  title: "Needle - AI Search",
  description: "Find the right open-source tool.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
export const metadata = {
  title: 'Himalingo Admin',
  description: 'Translation Management System',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>
        {children}
      </body>
    </html>
  )
}
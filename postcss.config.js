export default {
  plugins: {
    '@tailwindcss/postcss': {
      // Empty options to ensure compatibility
    },
    autoprefixer: {
      // Standard browser coverage
      overrideBrowserslist: [
        'last 2 versions',
        '> 1%',
        'IE 11',
        'not dead'
      ]
    },
  },
} 
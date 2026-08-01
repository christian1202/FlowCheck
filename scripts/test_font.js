try {
  const fonts = require('next/font/google');
  if ('Material_Symbols_Outlined' in fonts) {
    console.log("Material_Symbols_Outlined is available in next/font/google");
  } else {
    console.log("Not available");
  }
} catch(e) {
  console.error(e);
}

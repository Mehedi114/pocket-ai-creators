// Public settings only. NEVER put provider API keys or secrets here.
window.POCKET_SITE = {
  // Optional popunder: requires separate visitor opt-in as well as ad consent.
  popunderScriptUrl: 'https://abscloud.org/1/f8e269e4589d8040ab08f8af9e90d75c',
  // Optional floating Social Bar, loaded only after its separate opt-in.
  socialBarScriptUrl: 'https://bauval.org/14/32a8a1cbedf9018981bcc56ef9bed636',
  contactEmail: 'mmahedul358@gmail.com', // Public business contact; opens the visitor’s email app.
  // EASIEST: paste the full Banner embed into /adsterra-banner.html instead.
  // Legacy alternative: set your banner key and HTTPS invoke.js URL here.
  // Leave blank until your domain is approved. No ads load without visitor consent.
  adsterra: { key: '', scriptUrl: '', width: 728, height: 90 }
};

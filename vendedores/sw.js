/* RavenTechs: la app de vendedores se mudó a https://ventas.raventechsapp.com/vendedores/
   Este service worker solo limpia lo guardado y se desregistra para que el celular siga la redirección. */
self.addEventListener('install',function(){self.skipWaiting()});
self.addEventListener('activate',function(e){e.waitUntil((async function(){
  try{var ks=await caches.keys();await Promise.all(ks.map(function(k){return caches.delete(k)}))}catch(x){}
  try{await self.registration.unregister()}catch(x){}
  try{var cs=await self.clients.matchAll({type:'window'});cs.forEach(function(c){c.navigate(c.url)})}catch(x){}
})())});

function showView(id){
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active', t.dataset.view===id));
  window.scrollTo(0,0);
}
document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>showView(t.dataset.view)));

// Gallery: filter by venue + click-to-enlarge lightbox
document.querySelectorAll(".fbtn").forEach(function(btn){
  btn.addEventListener("click", function(){
    document.querySelectorAll(".fbtn").forEach(function(b){ b.classList.remove("active"); });
    btn.classList.add("active");
    var filter = btn.dataset.venue || "All";
    document.querySelectorAll(".gph").forEach(function(tile){
      var v = tile.dataset.venue;
      tile.style.display = (filter === "All" || v === filter) ? "" : "none";
    });
  });
});

function openLightbox(src){
  var lb = document.getElementById("lightbox");
  if(!lb){
    lb = document.createElement("div");
    lb.id = "lightbox";
    lb.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.9);display:flex;align-items:center;justify-content:center;z-index:999;cursor:zoom-out;padding:20px";
    lb.innerHTML = '<img style="max-width:95%;max-height:95%;border-radius:8px;box-shadow:0 10px 40px rgba(0,0,0,.5)">';
    lb.addEventListener("click", function(){ lb.remove(); });
    document.body.appendChild(lb);
  }
  lb.querySelector("img").src = src;
}
document.querySelectorAll(".gph img").forEach(function(img){
  img.style.cursor = "zoom-in";
  img.addEventListener("click", function(e){ e.stopPropagation(); openLightbox(img.src); });
});


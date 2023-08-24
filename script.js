const resultElement = document.querySelector(".result");

function happyPineapple() {
    document.querySelector(".result").classList.remove("sad-pineapple");
    document.querySelector(".result").classList.add("pineapple");
    lastSad = Date.now();
  }

  function sadPineapple() {
    document.querySelector(".result").classList.remove("pineapple");
    document.querySelector(".result").classList.add("sad-pineapple");
  }

let initialized = false;
let lastSad = Date.now();
let update_memory, facefinder_classify_region, do_puploc, ctx, processfn;

async function loadCascade(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const bytes = new Int8Array(buffer);
  return pico.unpack_cascade(bytes);
}

async function loadLocalizer(url) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  const bytes = new Int8Array(buffer);
  return lploc.unpack_localizer(bytes);
}

function rgba_to_grayscale(rgba, nrows, ncols) {
  var gray = new Uint8Array(nrows * ncols);
  for (var r = 0; r < nrows; ++r)
    for (var c = 0; c < ncols; ++c)
      gray[r * ncols + c] =
        (2 * rgba[r * 4 * ncols + 4 * c + 0] +
          7 * rgba[r * 4 * ncols + 4 * c + 1] +
          1 * rgba[r * 4 * ncols + 4 * c + 2]) /
        10;
  return gray;
}

async function activateCamera() {
  if (initialized) return;

  update_memory = pico.instantiate_detection_memory(5);
  facefinder_classify_region = await loadCascade(
    "https://raw.githubusercontent.com/nenadmarkus/pico/c2e81f9d23cc11d1a612fd21e4f9de0921a5d0d9/rnt/cascades/facefinder"
  );
  do_puploc = await loadLocalizer(
    "lib/puploc.bin"
  );

  ctx = document.getElementsByTagName("canvas")[0].getContext("2d");

  processfn = function (video, dt) {
    ctx.drawImage(video, 0, 0);
    var rgba = ctx.getImageData(0, 0, 640, 480).data;
    image = {
      pixels: rgba_to_grayscale(rgba, 480, 640),
      nrows: 480,
      ncols: 640,
      ldim: 640,
    };
    params = {
      shiftfactor: 0.1,
      minsize: 100,
      maxsize: 1000,
      scalefactor: 1.1,
    };

    dets = pico.run_cascade(image, facefinder_classify_region, params);
    dets = update_memory(dets);
    dets = pico.cluster_detections(dets, 0.2);

    for (i = 0; i < dets.length; ++i) {
      if (dets[i][3] > 50.0) {
        happyPineapple();
        var r, c, s;

        ctx.beginPath();
        ctx.arc(
          dets[i][1],
          dets[i][0],
          dets[i][2] / 2,
          0,
          2 * Math.PI,
          false
        );
        ctx.lineWidth = 2;
        ctx.strokeStyle = "red";
        ctx.stroke();

        r = dets[i][0] - 0.075 * dets[i][2];
        c = dets[i][1] - 0.175 * dets[i][2];
        s = 0.35 * dets[i][2];
        [r, c] = do_puploc(r, c, s, 63, image);
        if (r >= 0 && c >= 0) {
          ctx.beginPath();
          ctx.arc(c, r, 1, 0, 2 * Math.PI, false);
          ctx.lineWidth = 1;
          ctx.strokeStyle = "red";
          ctx.stroke();
        }

        r = dets[i][0] - 0.075 * dets[i][2];
        c = dets[i][1] + 0.175 * dets[i][2];
        s = 0.35 * dets[i][2];
        [r, c] = do_puploc(r, c, s, 63, image);
        if (r >= 0 && c >= 0) {
          ctx.beginPath();
          ctx.arc(c, r, 1, 0, 2 * Math.PI, false);
          ctx.lineWidth = 2;
          ctx.strokeStyle = "red";
          ctx.stroke();
        }
      }
    }
    if (Date.now() >= lastSad + 1000) {
      sadPineapple();
    }
  };

  new camvas(ctx, processfn);

  initialized = true;
}

activateCamera();
function camvas(ctx, callback) {
  var self = this
  this.ctx = ctx
  this.callback = callback

  var streamContainer = document.createElement('div')
  this.video = document.createElement('video')

  this.video.setAttribute('autoplay', '1')
  this.video.setAttribute('playsinline', '1')

  this.video.setAttribute('width', 1)
  this.video.setAttribute('height', 1)

  streamContainer.appendChild(this.video)
  document.body.appendChild(streamContainer)

  navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(function (stream) {
    self.video.srcObject = stream
    self.update()
  }, function (err) {
    throw err
  })

  this.update = function () {
    var self = this
    var last = Date.now()
    var loop = function () {
      var dt = Date.now() - last
      self.callback(self.video, dt)
      last = Date.now()
      requestAnimationFrame(loop)
    }
    requestAnimationFrame(loop)
  }
}

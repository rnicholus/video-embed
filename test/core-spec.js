suite('<video-embed>', function() {
    var loadVideo = function(url) {
            var ve = document.createElement('video-embed');
            ve.setAttribute('url', url);
            document.body.appendChild(ve);
            return ve;
        },
        removeVideo = function() {
            document.body.removeChild(document.querySelector('video-embed'));
        };

    afterEach(function() {
        removeVideo();
    });

    test('loads a YouTube video', function(done) {
        var ve = loadVideo('https://www.youtube.com/embed/C0DPdy98e4c');

        assert.ok(window.onYouTubeIframeAPIReady);

        ve.addEventListener('ready', function() {
            assert.ok(window.youTubeIframeApiReady);
            done();
        });
    });

    test('loads a Vimeo video', function(done) {
        var ve = loadVideo('https://player.vimeo.com/video/76979871');

        ve.addEventListener('ready', function() {
            done();
        });
    });

    describe('play, pause, currentTime tests', function() {
        var testPlayPauseCurrentTime = function(url, done) {
            var ve = loadVideo(url);

            ve.addEventListener('ready', function() {
                ve.play().then(function() {
                    setTimeout(function() {
                        ve.getCurrentTime().then(function(afterPlayTime) {
                            assert.ok(afterPlayTime > 0, afterPlayTime);

                            ve.pause().then(function() {
                                setTimeout(function() {
                                    ve.getCurrentTime().then(function(afterPauseTime) {
                                        setTimeout(function() {
                                            ve.getCurrentTime().then(function(afterPauseTime2) {
                                                assert.ok(afterPauseTime === afterPauseTime2);
                                                done();
                                            });
                                        }, 1000);
                                    });
                                }, 1000);
                            });
                        });
                    }, 1000);
                });
            });
        };

        test('plays and pauses a Vimeo video, with the currentTime accessible as well', function(done) {
            testPlayPauseCurrentTime('https://player.vimeo.com/video/76979871', done);
        });

        test('plays and pauses a YouTube video, with the currentTime accessible as well', function(done) {
            testPlayPauseCurrentTime('https://www.youtube.com/embed/C0DPdy98e4c', done);
        });
    })
});
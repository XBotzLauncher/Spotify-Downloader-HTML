#!/usr/bin/env node
var util = require('util'),

    colors = require('colors'),
    formatNumber = require('format-number')(),
    minimist = require('minimist'),
    musicVideo = require('youtube-best-video').findBestMusicVideo,
    search = require('youtube-search'),
    slashes = require('slashes'),
    timelabel = require('timelabel'),
    youtubeId = require('get-youtube-id'),

    package = require('./package');

var FORMATS = {
        '%t': 'title',
        '%a': 'author',
        '%d': 'description',
        '%D': 'duration',
        '%c': 'category',
        '%T': 'thumbnail',
        '%v': 'views',
        '%f': 'favorites',
        '%u': 'url',
        '%p': 'published'
    },

    FPCENT = String.fromCharCode(65285),
    MINIHOST = 'https://youtu.be/%s',

    PRETTY =
        colors.bold('%t') + ' (uploader: %a, views: ' + colors.green('%v')
        + ')\n' +
        colors.bold('duration: ') + '%D\n' +
        colors.bold('thumbnail: ') + '%T\n' +
        colors.bold('description: ') + '%d\n' +
        colors.bold('watch: ') + '%u\n\n';


var argv = minimist(process.argv.slice(2)),

    terms = argv._.join(' '),

    help = !!(argv.h || argv.help),

    limit = +(argv.l || argv.limit) || 1,
    offset = +(argv.o || argv.offset) || 1,
    music = !!(argv.m || argv.music),
    format = (argv.f || argv.format) || '%u',
    pretty = (argv.p || argv.pretty),

    nostrip = !!argv.nostrip,
    inhuman = !!argv.inhuman;

if (pretty) {
    format = PRETTY;
}

if (!nostrip) {
    format = slashes.strip(format);
}

function showHelp() {
    var formats;

    console.log(colors.bold(package.name + ' - ' + package.version));
    console.log(package.description + '\n');

    formats = Object.keys(FORMATS).reduce(function (list, symbol) {
        return list + '\t' + symbol + ' - ' + FORMATS[symbol] + '\n';
    }, '');

    console.log([
        'Usage: ytsearch ' + colors.underline('<terms>')
        + ' ' + colors.bold('[options]') + '\n',

        colors.bold('-h, --help'),
        '\tDisplay this screen.',

        colors.bold('-p, --pretty'),
        '\tSets the format to something pleasing to look at.',
        '\tdefault: ' + colors.underline('false'),

        colors.bold('-f, --format') + ' ' +
        colors.underline('"' + Object.keys(FORMATS).join(' ') + '"'),
        '\tFormat a video\'s meta data with a specific format string.\n',
        formats,
        '\tdefault: ' + colors.underline('"%u"'),

        colors.bold('-l, --limit') + ' '  + colors.underline('<number>'),
        '\tLimit the amount of videos returned by the specified number.',
        '\tdefault: ' + colors.underline('1'),

        colors.bold('-o, --offset') + ' ' + colors.underline('<number>'),
        '\tOffset the returned videos by the specified number.',
        '\tdefault: ' + colors.underline('1'),

        colors.bold('-m, --music'),
        '\tSelect the best music track for the specified terms. Note that this',
        '\tflag ignores limit and offset if set as it only returns one video.',
        '\tdefault: ' + colors.underline('false'),

        colors.bold('--nostrip'),
        '\tDon\'t strip the backslashes from the format string.',
        '\tdefault: ' + colors.underline('false'),

        colors.bold('--inhuman'),
        '\tDon\'t humanize any of the meta information.',
        '\tdefault: ' + colors.underline('false')
    ].join('\n'));
}

function formatVideo(video) {
    var display = format.slice();

    // Replace "%" with full-width percents.
    video.title = video.title.replace('%', FPCENT);

    if (video.description) {
        video.description = video.description.replace('%', FPCENT);
    } else {
        video.description = '';
    }

    video.url = util.format(MINIHOST, youtubeId(video.url));

    try {
        video.thumbnail = video.thumbnails[0].url;
    } catch (e) {
        video.thumbnail = '';
    }

    video.views = +video.statistics.viewCount || 0;
    video.favorites = +video.statistics.favouriteCount || 0;


    if (!inhuman) {
        video.duration = timelabel((+video.duration * 1000) || 0, true);

        video.views = formatNumber(video.views);
        video.favorites = formatNumber(video.favorites);
    }

    Object.keys(FORMATS).forEach(function (symbol) {
        if (format.indexOf(symbol) === -1) {
            return;
        }

        display = display.replace(symbol, video[FORMATS[symbol]]);
    });

    return display;
}

if (help || !terms) {
    return showHelp();
}

if (music) {
    return musicVideo(terms, function (err, video) {
        if (err) {
            return console.error(err.stack);
        }

        process.stdout.write(formatVideo(video));
    });
}

search(terms, {
    startIndex: offset,
    maxResults: limit
}, function (err, videos) {
    if (err) {
        return console.error(err.stack);
    }

    videos.forEach(function (video) {
        process.stdout.write(formatVideo(video));
    });
});

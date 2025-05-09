# ytsearch
Search YouTube from the command-line without an API key. It can fetch URLs and
various meta content in whatever output format you'd like. Out of the box it
pairs well with ytdl.

## Installation

    # npm install -g ytsearch

## Examples
Output the first five results for a search term with a pretty interface:

    $ ytsearch "the beatles" -p -l 5

Display the first five searches for terms with title, descriptions and URLs:

    $ ytsearch "dr katz" -f "%t\n%d\n%u\n\n" --limit 5

Stream a TV show to mplayer:

    $ ytdl "$(ytsearch "dr katz episode 2")" | mplayer -

Find the link for a music track, stream the download to ffmpeg which strips the
video, saves it to disk and finally streams the audio to mplayer:

    $ ytdl "$(ytsearch altogether\ now\ beatles --music)" | ffmpeg -i pipe:0  \
    -vn -f mp3 altogether.mp3 -f mp3 pipe:1 | mplayer -

## Manual
```
Usage: ytsearch <terms> [options]

-h, --help
        Display this screen.
-p, --pretty
        Sets the format to something pleasing to look at.
        default: false
-f, --format "%t %a %d %D %c %T %v %f %u %p"
        Format a video's meta data with a specific format string.

        %t - title
        %a - author
        %d - description
        %D - duration
        %c - category
        %T - thumbnail
        %v - views
        %f - favorites
        %u - url
        %p - published

        default: "%u"
-l, --limit <number>
        Limit the amount of videos returned by the specified number.
        default: 1
-o, --offset <number>
        Offset the returned videos by the specified number.
        default: 1
-m, --music
        Select the best music track for the specified terms. Note that this
        flag ignores limit and offset if set as it only returns one video.
        default: false
--nostrip
        Don't strip the backslashes from the format string.
        default: false
--inhuman
        Don't humanize any of the meta information.
        default: false
```

## License
MIT

# Update Manager

## Update scripts

Marlinraker will load all scripts contained in `marlinraker_files/update_scripts/` 
and use them for updating components. Update scripts show up in the update manager
with the same name as the file has (excluding the file extension). File names starting
with `_` are ignored.

When a script is called with `-i` as an argument, it should print a status information
JSON object to stdout. See the [Moonraker docs](https://moonraker.readthedocs.io/en/latest/web_api/#get-update-status)
for more information. A basic status information object could look like this:

```json
{
    "name": "mainsail",
    "owner": "mainsail-crew",
    "version": "v2.3.1",
    "remote_version": "v2.3.1",
    "configured_type": "web",
    "channel": "stable"
}
```

The `version` and `remote_version` fields **have** to be included for the update
script to work.

When called with `-u` as an argument, the update script should perform the
actual update. Messages printed to stdout will be sent to the web interface.

MarlinrakerOS already contains pre-made scripts for Marlinraker, Mainsail and Fluidd.
It also contains `_common.sh`, a bash script that includes multiple utility functions.

## Example

```shell
#!/bin/bash

REPO_OWNER="pauhull"
REPO_NAME="marlinraker"
DIR="/home/pi/marlinraker"

function fetch_latest_release {
    echo $(curl -s "https://api.github.com/repos/$1/$2/releases/latest")
}

function get_remote_version {
    version="$(grep -oPm 1 "\"tag_name\": \"\K[^\"]+")"
    if [ -z $version ]; then
        echo -n "?"
    else
        echo -n $version
    fi
}

function get_current_version {
    if [ -e $1 ]; then
        cat "$1/.version"
    else
        echo -n "?"
    fi
}

function do_update {
    latest_release=$(fetch_latest_release $1 $2)
    version=$(echo $latest_release | get_remote_version)
    download_url=$(echo $latest_release | grep -oPm 1 "\"browser_download_url\": \"\K[^\"]+")

    if [ -z $download_url ]; then
        echo "Cannot fetch download url"
        exit 1
    fi

    mkdir -pv "$3"
    cd "$3"
    rm -rfv *
    wget "$download_url" -O temp.zip 2>&1
    unzip -o temp.zip
    rm -f temp.zip
    rm -f .version
    touch .version
    echo -n $version >> .version
}

function get_info {
    current_version=$(get_current_version $3)
    remote_version=$(echo $(fetch_latest_release $1 $2) | get_remote_version)

    echo -n "{"\
"\"owner\":\"$1\","\
"\"name\":\"$2\","\
"\"version\":\"$current_version\","\
"\"remote_version\":\"$remote_version\","\
"\"configured_type\":\"web\","\
"\"channel\":\"stable\","\
"\"info_tags\":[]"\
"}"
}

function install {
    temp_dir=$(mktemp -d)
    mv "$DIR/node_modules" "$temp_dir/node_modules"
    mv "$DIR/package-lock.json" "$temp_dir/package-lock.json"
    do_update $REPO_OWNER $REPO_NAME $DIR
    cd $DIR
    mv "$temp_dir/node_modules" "$DIR/node_modules"
    mv "$temp_dir/package-lock.json" "$DIR/package-lock.json"
    rm -r "$temp_dir"
    echo "Installing npm packages..."
    npm install
    sudo systemctl restart marlinraker
}

if [ $# -eq 0 ]; then
    echo "Possible arguments: --info (-i), --update (-u)"
    exit 1
fi

case $1 in
    -i|--info) get_info $REPO_OWNER $REPO_NAME $DIR;;
    -u|--update) install;;
    *) echo "Unknown task \"$1\""; exit 1;;
esac
```
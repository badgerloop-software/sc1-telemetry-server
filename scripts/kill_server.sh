#!/bin/bash

# Set the default working directory
w_dir=..

# Parse arguments
while [[ "$1" =~ ^- && ! "$1" == "--" ]]; do case $1 in
	-w )
		shift; w_dir=$1
		;;
esac; shift; done
if [[ "$1" == '--' ]]; then shift; fi

# File containing the server PID
spid_file=$w_dir/server_pid

# Check that the file containing the server PID exists
# If not, tell the user to search for the process running 'node ./index.js' and handle killing the server manually
if [[ ! -e $spid_file ]]; then
	echo -e "\nERROR: Couldn't find $spid_file\n\nTry running \`ps -ef | grep \"node ./index.js\"\` to find the process running the server (if it exists)\n\tNOTE - This will return a line containing the grep command you just ran; ignore this.\n"
	echo -e "If a process running the server is found, run \`kill [PID]\` to kill process.\n"
	exit 1
fi

# Search for the server PID to see if the server process is running
spid=`grep -o -E "[[:digit:]]*" $spid_file` # Get only the PID from the file containing the server PID (avoid searching for a bad string)
pid_search=$(ps -ef | grep -E "$spid.*node $w_dir/index\.js")

if [[ -n $pid_search ]]; then
	# The PID was found (the regex returned a non-empty string)
	# Kill the existing process running the server
	echo -e "\nKILLING SERVER PROCESS\n$pid_search\n"
	kill $spid
else
	# Process running the server wasn't found
	# Inform the user, including the command used to search for the process (in case anything is wrong with it)
	echo -e "\nServer is not running\n\nUsed the command \`ps -ef | grep -E \"$spid.*node ./index.js\"\` to search for a process running the server.\n"
	# Recommend another search command in case the user still thinks the server is running
	echo -e "Could try running \`ps -ef | grep \"node ./index.js\"\` to search for the process running the server (if it exists)\n\tNOTE - This will return a line containing the grep command you just ran; ignore this.\n"
fi


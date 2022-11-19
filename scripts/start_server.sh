#!/bin/bash

# Set a flag to indicate if the script should check if the server is already running
check_flag=1
# Set a flag to indicate if the server should be run in the background
bg_flag=1
# Set the default working directory
w_dir=..

# Parse arguments
while [[ "$1" =~ ^- && ! "$1" == "--" ]]; do case $1 in
	--no-check )
		check_flag=0
		;;
	--foreground )
		bg_flag=0
		;;
	-w )
		shift; w_dir=$1
		;;
esac; shift; done
if [[ "$1" == '--' ]]; then shift; fi

# If check_flag is 1, check if the server is already running before trying to start the server
if (( $check_flag )); then
	# File containing server PID
	spid_file=$w_dir/server_pid
	
	# Check that a file containing the server PID exists
	# If not, tell the user to search for the process running 'node ./index.js' and handle killing the server manually
	if [[ ! -e $spid_file ]]; then
		echo -e "\nERROR: Couldn't find $spid_file\n\nTry running \`ps -ef | grep \"node ./index.js\"\` to find the process running the server\n\tNOTE - This will return a line containing the grep command you just ran; ignore this.\n"
		echo -e "If you can't find the process or know that the server isn't running, run \`npm run start-[fg|bg] -- --no-check\` to start the server in the foreground/background without checking for an existing process running the server.\n"
		exit 1
	fi
	
	# Search for the PID in server_pid to see if the process is still running
	spid=`grep -o -E "[[:digit:]]*" $spid_file` # Get only the PID from the file containing the server PID (avoid searching for a bad string)
	pid_search=$(ps -ef | grep -E "$spid[^\[]")
	
	if [[ -n $pid_search ]]; then
		# The PID was found (the regex returned a non-empty string)
		# Check if the user wants to kill the process running the server
		input=""
		echo -e "\nSERVER IS ALREADY RUNNING IN THE BACKGROUND\n\nFound process: ${pid_search}\n\n"
		
		while [[ $input != @(y|n) ]]; do
			echo -en "\033[1A\033[2K"
			echo -n "Kill existing background process (y/n)? "
			read input
		done
		
		# Kill the existing background process running the server if the user wants to
		if [[ $input == "y" ]]; then
			#TODO Remove echo
			echo "KILLING SERVER"
			kill $spid # TODO `cat server_pid`
		else
			#TODO Remove echo
			echo "Won't kill server"
			# If the user doesn't want to kill the server, exit
			exit 0
		fi
	fi
fi

# Run the server in the background or foreground depending on bg_flag
if (( $bg_flag )); then
	# Get the current date and time to add to the log file name
	time_str=$(date +'%m-%d-%Y_%H-%M-%S')
	# Server log directory
	log_dir=$w_dir/server_logs
	
	# Create server log directory if it doesn't exist
	if [[ ! -e $log_dir ]]; then
		mkdir $log_dir
	fi
	
	# Display log file information
	echo -e "STARTING THE SERVER IN THE BACKGROUND\n"
	echo "Log file: $log_dir/$time_str.log"
	echo -e "Error log file: $log_dir/${time_str}_error.log\n"

	: '
	Run the server inteh background, immune to hangups
	Save stdout from server in $log_dir/$time_str.log
	Save stderr (2) from server in $log_dir/${time_str}_error.log
	Save the PID of the `node $w_dir/index.js` command in $spid_file so that the server can be stopped later by killing that process
	'
	nohup node $w_dir/index.js > $log_dir/$time_str.log 2>$log_dir/${time_str}_error.log & echo $! > $spid_file
else
	echo -e "STARTING THE SERVER IN THE FOREGROUND\n"

	# Start the server in the foreground
	node $w_dir/index.js
fi


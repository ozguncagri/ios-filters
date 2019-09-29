// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// always-run-in-app: true; icon-color: green;
// icon-glyph: download;
const blacklistedDomains = [
	// PiHole Lists
	"https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts",
	"https://mirror1.malwaredomains.com/files/justdomains",
	"http://sysctl.org/cameleon/hosts",
	"https://s3.amazonaws.com/lists.disconnect.me/simple_tracking.txt",
	"https://s3.amazonaws.com/lists.disconnect.me/simple_ad.txt",
	"https://hosts-file.net/ad_servers.txt",

	// My Custom Lists
	"https://raw.githubusercontent.com/BlackJack8/iOSAdblockList/master/Hosts.txt",
	"https://raw.githubusercontent.com/EnergizedProtection/block/master/ultimate/formats/domains.txt",
	"https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/fakenews-gambling-porn-social/hosts",
	"https://raw.githubusercontent.com/mtxadmin/ublock/master/hosts.txt",
	"https://gist.githubusercontent.com/anudeepND/adac7982307fec6ee23605e281a57f1a/raw/5b8582b906a9497624c3f3187a49ebc23a9cf2fb/Test.txt",
	"http://www.malwaredomainlist.com/hostslist/hosts.txt",
	"https://ozguncagri.com/ios-filters/BlackListedDomains.txt",
];

const spotifyBlackList = "https://ozguncagri.com/ios-filters/SpotifyAdServices.txt"

const whiteListedDomains = [
	"https://ozguncagri.com/ios-filters/WhiteListedDomains.txt",
]

const ipRegex = /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/;

const urlRegex = /((?:[\w-]+)(?:\.[\w-]+)+)(?:[\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/;

let finalList = new Set;

function parseAndAddDomains(data) {
	let lines = data.split(/\n/);

	for (let line of lines) {
		line = line.replace(/#.*/, '')
		line = line.trim()
		let lineParts = line.split(/\s/)
		partIter: for (let part of lineParts) {
			// Skip if part is ip address
			if (ipRegex.test(part)) {
				continue partIter
			}

			// Add url
			if (urlRegex.test(part)) {
				finalList.add(part)
			}
		}
	}
}

function parseAndRemoveDomains(data) {
	let lines = data.split(/\n/);

	for (let line of lines) {
		line = line.replace(/#.*/, '')
		line = line.trim()
		let lineParts = line.split(/\s/)
		partIter: for (let part of lineParts) {
			// Skip if part is ip address
			if (ipRegex.test(part)) {
				continue partIter
			}

			// Add url
			if (urlRegex.test(part)) {
				finalList.delete(part)
			}
		}
	}
}

// Start downloading and parsing hosts and blacklist files
for (let url of blacklistedDomains) {
	let req = new Request(url)
	let data = await req.loadString()
	parseAndAddDomains(data)
}

// Start downloading and parsing whitelisted domains files
for(let url of whiteListedDomains) {
	let req = new Request(url)
	let data = await req.loadString()
	parseAndRemoveDomains(data)
}

let askSpotify = new Alert()
askSpotify.title = "Block Spotify Ads"
askSpotify.message = "Would you like to block spotify ad services?\n\n(It can break your experience if you are premium user)"
askSpotify.addAction("Yes, Block Spotify Ads")
askSpotify.addCancelAction("No, Skip Blocking Spotify Ads")
let result = await askSpotify.presentAlert()
if (result === 0) {
	let req = new Request(spotifyBlackList)
	let data = await req.loadString()
	parseAndAddDomains(data)
}

// Write blacklist entries to file
let fm = FileManager.local()
let dir = fm.bookmarkedPath("Hosts")
let path = fm.joinPath(dir, "BlacklistedDomains.txt")

// Sort and join the array using new line character and write output to file
fm.writeString(path, Array.from(finalList).sort().join("\n"))

// Let user know what the hell happened
let alert = new Alert()
alert.title = "Update Succeed"
alert.message = "Blacklist updated. Please restart DNSCloak's server."
alert.addAction("Got It")
alert.presentAlert()
// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// always-run-in-app: true; icon-color: green;
// icon-glyph: download;
let welcomeInteraction = new Alert()

welcomeInteraction.title = "Welcome"
welcomeInteraction.message = [
	"Welcome to Ozzy's Blacklist generator.",
	"First thing to do fetch information about all lists.",
	"Hit 'Continue' when you are ready to download it."
].join("\n\n")

welcomeInteraction.addAction("Continue")
await welcomeInteraction.presentAlert()

// Define required variables and contants
const ipRegex = /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/;
const urlRegex = /((?:[\w-]+)(?:\.[\w-]+)+)(?:[\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/;

let selectedBlacklists = []
let isSpotifyIncluded = false
let protectionTitle = 'No'
let finalList = new Set;

// Define parse and add urls function for blacklists
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

// Define parse and remove urls function for whitelists
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

			// Remove url
			if (urlRegex.test(part)) {
				finalList.delete(part)
			}
		}
	}
}

// First download all new list files' urls
let allListsRequest = new Request("https://ozguncagri.com/ios-filters/allLists.json")
let allListsData = await allListsRequest.loadJSON()

let blacklistSelectionInteraction = new Alert()

blacklistSelectionInteraction.title = "Select Protection"
blacklistSelectionInteraction.message = [
	"Great! Now; What kind of protection you want?",
	"Minimal : Great for not breaking most things.",
	"Full : May cause to not work some sites, apps or services"
].join("\n\n")

blacklistSelectionInteraction.addAction("Minimal")
blacklistSelectionInteraction.addAction("Full")

let blacklistSelectionInteractionAnswer = await blacklistSelectionInteraction.presentAlert()
switch (blacklistSelectionInteractionAnswer) {
	case 0:
		protectionTitle = 'Minimal'
		selectedBlacklists = allListsData.minimalBlacklists
		break;
	case 1:
		protectionTitle = 'Full'
		selectedBlacklists = allListsData.fullBlacklists
		break;
}

let spotifyBlacklistInteraction = new Alert()
spotifyBlacklistInteraction.title = "Block Spotify Ads"
spotifyBlacklistInteraction.message = [
	"Would you like to block Spotify ad service domains?",
	"(It can break your experience if you are premium user)"
].join("\n\n")
spotifyBlacklistInteraction.addAction("Yes, Block Spotify Ads")
spotifyBlacklistInteraction.addAction("No, Skip Blocking Spotify Ads")
let spotifyBlacklistInteractionAnswer = await spotifyBlacklistInteraction.presentAlert()
if (spotifyBlacklistInteractionAnswer === 0) {
	isSpotifyIncluded = true
	for (let listItem of allListsData.spotifyBlacklists) {
		selectedBlacklists.push(listItem)
	}
}

// Confirmation
let confirmInteraction = new Alert()
confirmInteraction.title = "Confirmation"
confirmInteraction.message = [
	`You are protected with this profile : '${protectionTitle}'`,
	isSpotifyIncluded ? 'Spotify ads will be blocked' : 'Skip blocking spotify ads',
	'Are sure about your selections?'
].join("\n\n")
confirmInteraction.addAction("Yes, Continue")
confirmInteraction.addCancelAction("No, Cancel It")
let confirmInteractionAnswer = await confirmInteraction.presentAlert()
if (confirmInteractionAnswer === -1) {
	return
}

// Start downloading and parsing hosts and blacklist files
for (let url of selectedBlacklists) {
	let req = new Request(url)
	let data = await req.loadString()
	parseAndAddDomains(data)
}

// Start downloading and parsing whitelisted domains files
for(let url of allListsData.whitelists) {
	let req = new Request(url)
	let data = await req.loadString()
	parseAndRemoveDomains(data)
}

// Write blacklist entries to file
let fm = FileManager.local()
let dir = fm.bookmarkedPath("Hosts")
let path = fm.joinPath(dir, "BlacklistedDomains.txt")

// Sort and join the array using new line character and write output to file
fm.writeString(path, Array.from(finalList).sort().join("\n"))

// Let user know what the hell happened
let alert = new Alert()
alert.title = "Successfully Generated"
alert.message = "Your blacklist is successfully generated. Please restart DNSCloak's server."
alert.addAction("Got It")
alert.presentAlert()

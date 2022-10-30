# Security

## Important security notice
- **Never** expose Marlinraker outside your local network!
- **Never** use Marlinraker in an untrusted public network!
- **Do not** leave your printer unattended when printing!

Marlinraker makes your printer fully controllable over the network
it is connected to. A malicious person in your network could send
G-codes to your printer that could potentially damage it or even
**cause a fire**! Although modern printer firmwares have failsafes
in place, it is never a good idea to make your printer publicly
accessible. [Here's why](https://isc.sans.edu/forums/diary/3D+Printers+in+The+Wild+What+Can+Go+Wrong/24044/).

If you want to remotely **and** securely connect to your 3D printer,
consider setting up a private VPN. Popular home VPN options include
[PiVPN](https://www.pivpn.io/) and [OpenVPN](https://openvpn.net/).
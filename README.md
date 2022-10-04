This is my attempt at automating my homelab, it is highly work-in-progress,
nowhere near completion and it's hardly portable to different setups.

### Prerequisites

Currently bare-metal provisioning is not implemented, meaning that going from a
clean machine to a working installation is done manually. Additionally the
current configuration expects to be able to resolve `<hostname>.lan` domains
similarly to how [Avahi][] would but using `.lan` instead of `.local`; this is
currently achieved by running [dnsmasq][] with the following config:

```ini
local=/lan/
domain=lan
auth-server=lan
auth-zone=lan

# Because there are projects like Home Assistant that actively refuse to
# support being served under a path other than the root "/", our only option
# is to use subdomains instead... thanks!
# https://github.com/home-assistant/architecture/issues/156#issuecomment-474188485
cname=homelab.lan,*.homelab.lan,homelab01.lan
```

[avahi]: https://wiki.archlinux.org/title/Avahi
[dnsmasq]: https://wiki.archlinux.org/title/Dnsmasq

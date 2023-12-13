{ ... }: {
  networking.firewall.allowedUDPPorts = [ 5353 ];

  services.avahi = {
    enable = true;
    nssmdns = true; # allows local resolution of `.local` domains

    publish = {
      enable = true;
      addresses = true; # allows others to resolve `${hostname}.local`
    };
  };
}

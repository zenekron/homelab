# https://colmena.cli.rs/
# https://search.nixos.org/options
{
  meta = { };

  defaults = { name, ... }: {
    imports = [
      ./configurations/avahi.nix
      ./configurations/nvd.nix
      ./hosts/${name}.hardware.nix
    ];

    deployment.targetHost = "${name}.local";

    time.timeZone = "Europe/Rome";

    networking = {
      hostName = name;
      nameservers = [ "1.1.1.1" "8.8.8.8" "8.8.4.4" ];
      useDHCP = true; # enables DHCP on all interfaces

      firewall.enable = true;
    };

    users.users.root.openssh.authorizedKeys.keys = [
      "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIBHhaAO0mR02QM0xF1/+aYPGqAbASkXHal1uGs+fio/z zenekron@fry"
    ];

    services.openssh = {
      enable = true;
      settings = {
        PasswordAuthentication = false;
      };
    };
  };

  tnas = { ... }: {
    # Select internationalisation properties.
    # i18n.defaultLocale = "en_US.UTF-8";
    # console = {
    #   font = "Lat2-Terminus16";
    #   keyMap = "us";
    #   useXkbConfig = true; # use xkb.options in tty.
    # };
  };
}

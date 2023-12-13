{ pkgs, config, ... }: {
  environment.systemPackages = with pkgs; [ nvd ];

  system.activationScripts.diff = ''
    PATH="$PATH:${config.nix.package}/bin" \
      ${pkgs.nvd}/bin/nvd diff /run/current-system "$systemConfig"
  '';
}

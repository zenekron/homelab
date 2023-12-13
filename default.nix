{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  nativeBuildInputs = with pkgs.buildPackages; [
    colmena
    nixd
    nixpkgs-fmt
  ];
}

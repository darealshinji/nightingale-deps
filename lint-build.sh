#!/bin/bash

set -e

export DIR="$(cd -P "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export SB_VENDOR_BINARIES_CO_ROOT=$DIR
export SB_VENDOR_BUILD_ROOT=$DIR

export LINT_BUILD=1

debug=enabled

for opt; do
  optarg="${opt#*=}"
  case "$opt" in
    --disable-debug)
      debug="disabled"
      ;;
    --arch=*)
      arch="$optarg"
      ;;
    *)
      origpath="$optarg"
      ;;
  esac
done

if [ "x$arch" = "x" ]; then
    arch=$(uname -m)
fi
case $arch in
    i?86|ppc)
        mflag="-m32"
        ;;
    x86?64|ppc64|amd64)
        mflag="-m64"
        ;;
    *)
        mflag=""
        ;;
esac

rm -rf build
mkdir build

case $OSTYPE in
    linux*)
        # hardening flags
        export CFLAGS="$mflag -fstack-protector --param=ssp-buffer-size=4 -D_FORTIFY_SOURCE=2"
        export CXXFLAGS="$mflag -fstack-protector --param=ssp-buffer-size=4 -D_FORTIFY_SOURCE=2"
        export LDFLAGS="$mflag -Wl,-z,now -Wl,-z,relro"
        export SB_CFLAGS=$CFLAGS
        export SB_CCFLAGS=$CFLAGS
        export SB_CXXFLAGS=$CXXFLAGS
        export SB_LDFLAGS=$LDFLAGS

        if [ -n "$DIST_NAME_BINARIES_DIR" ] ; then
            if [ "$DIST_NAME_BINARIES_DIR" -eq "1" ]; then
                mkdir -p "dist/linux-$arch"
            fi
        fi
        mkdir -p "linux-$arch"
        mkdir -p "checkout/linux-$arch"

        mkflags="SB_VENDOR_ARCH=Linux SB_VENDOR_SUBARCH=$arch SB_TARGET_ARCH=linux-$arch SB_ARCH_DETECTED=1"

        if [ $debug = enabled ]; then
            xr_target="xr-all"
        else
            xr_target="xr-release"
            mkflags="$mkflags SB_BUILD_TYPE=release"
        fi

        echo -e "Building sqlite...\n"
        make -C sqlite -f Makefile.songbird $mkflags

        echo -e "Building taglib...\n"
        make -C taglib -f Makefile.songbird $mkflags

        echo -e "Building xulrunner 1.9.2...\n"
        make -C xulrunner-1.9.2 -f Makefile.songbird $xr_target $mkflags

    ;;
    *)
        echo "Hardening isn't relevant for you."
    ;;
esac

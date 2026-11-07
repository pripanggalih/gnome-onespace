UUID := onespace@pripanggalih.github.io
VERSION := $(shell sed -n 's/.*"version": *\([0-9]*\).*/\1/p' metadata.json)
BUILD := build
ZIP := $(BUILD)/$(UUID).shell-extension.zip
INSTALL_DIR := $(HOME)/.local/share/gnome-shell/extensions/$(UUID)

SOURCES := metadata.json extension.js prefs.js schemas/*.gschema.xml

.PHONY: all pack install uninstall clean

all: pack

$(ZIP): $(SOURCES)
	rm -rf $(BUILD)/stage
	mkdir -p $(BUILD)/stage/schemas
	cp metadata.json extension.js prefs.js LICENSE $(BUILD)/stage/
	cp schemas/*.gschema.xml $(BUILD)/stage/schemas/
	glib-compile-schemas $(BUILD)/stage/schemas
	rm -f $@
	cd $(BUILD)/stage && zip -qr ../$(notdir $@) .
	@echo "Packed $@ (version $(VERSION))"

pack: $(ZIP)

install: pack
	gnome-extensions install --force $(ZIP)
	@echo "Installed. Log out and back in, then run: gnome-extensions enable $(UUID)"

uninstall:
	gnome-extensions uninstall $(UUID)

clean:
	rm -rf $(BUILD)

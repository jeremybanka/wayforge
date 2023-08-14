PACKAGES := \
  junction \
	types

all: $(PACKAGES)

$(PACKAGES):
	@echo "Processing $@"
	@cd $@ && tsup

.PHONY: all $(PACKAGES)

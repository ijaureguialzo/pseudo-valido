#!make

help: _header
	${info }
	@echo Opciones:
	@echo -----------------
	@echo start
	@echo build
	@echo test
	@echo outdated / update
	@echo -----------------

_header:
	@echo -------------
	@echo Pseudo-Valido
	@echo -------------

start:
	@pnpm run dev

build:
	@pnpm run build

test:
	@pnpm run test

outdated:
	@pnpm outdated

update:
	@pnpm update

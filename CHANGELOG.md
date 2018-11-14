# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="3.0.2"></a>
## [3.0.2](https://github.com/martinheidegger/conf-cal/compare/v3.0.1...v3.0.2) (2018-11-14)


### Bug Fixes

* descriptions with lists create descriptions, no weird entries. ([24243fb](https://github.com/martinheidegger/conf-cal/commit/24243fb))
* indentation errors with descriptions of subentries & description of an entry after the subentries list. ([92441f3](https://github.com/martinheidegger/conf-cal/commit/92441f3))



<a name="3.0.1"></a>
## [3.0.1](https://github.com/martinheidegger/conf-cal/compare/v3.0.0...v3.0.1) (2018-11-14)


### Bug Fixes

* consistent behaviour of continuation lines ([789004d](https://github.com/martinheidegger/conf-cal/commit/789004d))



<a name="3.0.0"></a>
# [3.0.0](https://github.com/martinheidegger/conf-cal/compare/v2.12.1...v3.0.0) (2018-11-13)


### Features

* person based lookup ([096e9bd](https://github.com/martinheidegger/conf-cal/commit/096e9bd))
* **data:** added property 'room' to entries in order to efficiently iterate over entries. ([00b52ac](https://github.com/martinheidegger/conf-cal/commit/00b52ac))


### BREAKING CHANGES

* persons now contains a map to looking all persons instead of a list of all persons in the calendar.



<a name="2.12.1"></a>
## [2.12.1](https://github.com/martinheidegger/conf-cal/compare/v2.12.0...v2.12.1) (2018-11-12)


### Bug Fixes

* **csv:** more comfortable key schema ([61d30af](https://github.com/martinheidegger/conf-cal/commit/61d30af))



<a name="2.12.0"></a>
# [2.12.0](https://github.com/martinheidegger/conf-cal/compare/v2.11.0...v2.12.0) (2018-11-12)


### Features

* **csv:** Added export to csv ([08c1bd6](https://github.com/martinheidegger/conf-cal/commit/08c1bd6))



<a name="2.11.0"></a>
# [2.11.0](https://github.com/martinheidegger/conf-cal/compare/v2.10.0...v2.11.0) (2018-11-12)


### Bug Fixes

* **lint:** some typos ([b31f0bd](https://github.com/martinheidegger/conf-cal/commit/b31f0bd))
* **markdown:** fixed markdown renderer to output proper, better-readable markdown tables without special html tags. ([92b01c3](https://github.com/martinheidegger/conf-cal/commit/92b01c3))


### Features

* **lang:** added language support. closes [#2](https://github.com/martinheidegger/conf-cal/issues/2) ([e6911a0](https://github.com/martinheidegger/conf-cal/commit/e6911a0))



<a name="2.10.0"></a>
# [2.10.0](https://github.com/martinheidegger/conf-cal/compare/v2.9.1...v2.10.0) (2018-11-12)


### Bug Fixes

* Added check to make sure that the document has consistent index and a clear error message if it doesnt. ([00b8598](https://github.com/martinheidegger/conf-cal/commit/00b8598))
* Added check to make sure that the document has consistent index and a clear error message if it doesnt. - 2 ([ac5bf54](https://github.com/martinheidegger/conf-cal/commit/ac5bf54))
* Made sure that sub-indentations don't cause the creation of new rooms. Fixes [#11](https://github.com/martinheidegger/conf-cal/issues/11) ([63cad75](https://github.com/martinheidegger/conf-cal/commit/63cad75))


### Features

* Added line output to calendar error entry with highlighting of columns. ([9d9ffcb](https://github.com/martinheidegger/conf-cal/commit/9d9ffcb))



<a name="2.9.1"></a>
## [2.9.1](https://github.com/martinheidegger/conf-cal/compare/v2.9.0...v2.9.1) (2018-11-08)



<a name="2.9.0"></a>
# [2.9.0](https://github.com/martinheidegger/conf-cal/compare/v2.8.0...v2.9.0) (2018-10-19)


### Features

* added support for a custom cache location ([2075011](https://github.com/martinheidegger/conf-cal/commit/2075011))



<a name="2.8.0"></a>
# [2.8.0](https://github.com/martinheidegger/conf-cal/compare/v2.7.1...v2.8.0) (2018-10-18)


### Features

* **custom-id:** Added support for custom id's set by the user. ([eb54006](https://github.com/martinheidegger/conf-cal/commit/eb54006))
* **data:** Added support for automatic ids. ([230cbcd](https://github.com/martinheidegger/conf-cal/commit/230cbcd))



<a name="2.7.1"></a>
## [2.7.1](https://github.com/martinheidegger/conf-cal/compare/v2.7.0...v2.7.1) (2018-10-18)


### Bug Fixes

* linting typo ([aa5e0eb](https://github.com/martinheidegger/conf-cal/commit/aa5e0eb))



<a name="2.7.0"></a>
# [2.7.0](https://github.com/martinheidegger/conf-cal/compare/v2.6.0...v2.7.0) (2018-10-18)


### Features

* **data:** Added a quickly accessible list of all persons. ([b19b8b1](https://github.com/martinheidegger/conf-cal/commit/b19b8b1))


### Performance Improvements

* Removed heavy fs-extra dependency. ([767122f](https://github.com/martinheidegger/conf-cal/commit/767122f))



<a name="2.6.0"></a>
# [2.6.0](https://github.com/martinheidegger/conf-cal/compare/v2.5.0...v2.6.0) (2018-10-18)


### Bug Fixes

* **breaks:** Update of geoTz changed the API! ([75eb924](https://github.com/martinheidegger/conf-cal/commit/75eb924))


### Features

* **data:** Added support for descriptions in events. ([1d65527](https://github.com/martinheidegger/conf-cal/commit/1d65527))
* Improved getTimeZone performance and stability ([fabc0d7](https://github.com/martinheidegger/conf-cal/commit/fabc0d7))



<a name="2.5.0"></a>
# [2.5.0](https://github.com/martinheidegger/conf-cal/compare/v2.4.0...v2.5.0) (2017-11-29)


### Bug Fixes

* **breaks:** multiline entries need breaks <br> ([baa1fc3](https://github.com/martinheidegger/conf-cal/commit/baa1fc3))


### Features

* **parser:** Added support for lists in multiline entries ([9f5e05f](https://github.com/martinheidegger/conf-cal/commit/9f5e05f))
* **parser:** Added support for multiline calendar entries ([d24d1cf](https://github.com/martinheidegger/conf-cal/commit/d24d1cf))
* **renderer:** Added support for lists in renderer ([43fb01f](https://github.com/martinheidegger/conf-cal/commit/43fb01f))



<a name="2.4.0"></a>
# [2.4.0](https://github.com/martinheidegger/conf-cal/compare/v2.3.0...v2.4.0) (2017-11-24)


### Features

* **render:** Added quickEscape to make escaping in templates easier ([71c8ad8](https://github.com/martinheidegger/conf-cal/commit/71c8ad8))



<a name="2.3.0"></a>
# [2.3.0](https://github.com/martinheidegger/conf-cal/compare/v2.2.1...v2.3.0) (2017-11-24)


### Features

* **render:** Added flexibility for time rendering ([de3affd](https://github.com/martinheidegger/conf-cal/commit/de3affd))



<a name="2.2.1"></a>
## [2.2.1](https://github.com/martinheidegger/conf-cal/compare/v2.2.0...v2.2.1) (2017-11-24)



<a name="2.2.0"></a>
# [2.2.0](https://github.com/martinheidegger/conf-cal/compare/v2.1.0...v2.2.0) (2017-11-07)


### Features

* **render:** Added more template handlers in rendering ([1319b2b](https://github.com/martinheidegger/conf-cal/commit/1319b2b))



<a name="2.1.0"></a>
# [2.1.0](https://github.com/martinheidegger/conf-cal/compare/v2.0.1...v2.1.0) (2017-11-06)


### Bug Fixes

* linting ([d5ea8b9](https://github.com/martinheidegger/conf-cal/commit/d5ea8b9))
* switched to good iso format ([676e0f0](https://github.com/martinheidegger/conf-cal/commit/676e0f0))
* using actual timezones for the provided dates ([1154296](https://github.com/martinheidegger/conf-cal/commit/1154296))


### Features

* **data:** Returning the timeZone as part of slots ([3cc5068](https://github.com/martinheidegger/conf-cal/commit/3cc5068))
* **render:** Added flexible rendering for documents, markdown renderer included ([75989dc](https://github.com/martinheidegger/conf-cal/commit/75989dc))



<a name="2.0.1"></a>
## [2.0.1](https://github.com/martinheidegger/conf-cal/compare/v2.0.0...v2.0.1) (2017-11-06)


### Bug Fixes

* merging null slots is easier deal with than empty entries ([4c125c2](https://github.com/martinheidegger/conf-cal/commit/4c125c2))



<a name="2.0.0"></a>
# 2.0.0 (2017-11-06)

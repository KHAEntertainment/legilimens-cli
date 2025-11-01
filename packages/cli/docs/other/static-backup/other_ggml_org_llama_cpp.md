[Skip to content](https://github.com/ggml-org/llama.cpp#start-of-content)

You signed in with another tab or window. [Reload](https://github.com/ggml-org/llama.cpp) to refresh your session.You signed out in another tab or window. [Reload](https://github.com/ggml-org/llama.cpp) to refresh your session.You switched accounts on another tab or window. [Reload](https://github.com/ggml-org/llama.cpp) to refresh your session.Dismiss alert

{{ message }}

[ggml-org](https://github.com/ggml-org)/ **[llama.cpp](https://github.com/ggml-org/llama.cpp)** Public

- Couldn't load subscription status.
Retry











### Uh oh!







There was an error while loading. [Please reload this page](https://github.com/ggml-org/llama.cpp).

- [Fork\\
13.4k](https://github.com/login?return_to=%2Fggml-org%2Fllama.cpp)
- [Star\\
88.4k](https://github.com/login?return_to=%2Fggml-org%2Fllama.cpp)


LLM inference in C/C++


### License

[MIT license](https://github.com/ggml-org/llama.cpp/blob/master/LICENSE)

[88.4k\\
stars](https://github.com/ggml-org/llama.cpp/stargazers) [13.4k\\
forks](https://github.com/ggml-org/llama.cpp/forks) [Branches](https://github.com/ggml-org/llama.cpp/branches) [Tags](https://github.com/ggml-org/llama.cpp/tags) [Activity](https://github.com/ggml-org/llama.cpp/activity)

[Star](https://github.com/login?return_to=%2Fggml-org%2Fllama.cpp)

Couldn't load subscription status.
Retry

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/ggml-org/llama.cpp).

# ggml-org/llama.cpp

master

[**494** Branches](https://github.com/ggml-org/llama.cpp/branches) [**4628** Tags](https://github.com/ggml-org/llama.cpp/tags)

[Go to Branches page](https://github.com/ggml-org/llama.cpp/branches)[Go to Tags page](https://github.com/ggml-org/llama.cpp/tags)

Go to file

Code

Open more actions menu

## Folders and files

| Name | Name | Last commit message | Last commit date |
| --- | --- | --- | --- |
| ## Latest commit<br>[![slaren](https://avatars.githubusercontent.com/u/2141330?v=4&size=40)](https://github.com/slaren)[slaren](https://github.com/ggml-org/llama.cpp/commits?author=slaren)<br>[llama : disable pipeline parallelism if compute buffer allocation fai…](https://github.com/ggml-org/llama.cpp/commit/5a4ff43e7dd049e35942bc3d12361dab2f155544)<br>Open commit detailsfailure<br>1 hour agoOct 27, 2025<br>[5a4ff43](https://github.com/ggml-org/llama.cpp/commit/5a4ff43e7dd049e35942bc3d12361dab2f155544) · 1 hour agoOct 27, 2025<br>## History<br>[6,857 Commits](https://github.com/ggml-org/llama.cpp/commits/master/) <br>Open commit details<br>[View commit history for this file.](https://github.com/ggml-org/llama.cpp/commits/master/) |
| [.devops](https://github.com/ggml-org/llama.cpp/tree/master/.devops ".devops") | [.devops](https://github.com/ggml-org/llama.cpp/tree/master/.devops ".devops") | [nix : removed metal for nix (](https://github.com/ggml-org/llama.cpp/commit/1d49ca37594fb49db6aa9518ba7c512e5ccd0108 "nix : removed metal for nix (#16118)") [#16118](https://github.com/ggml-org/llama.cpp/pull/16118) [)](https://github.com/ggml-org/llama.cpp/commit/1d49ca37594fb49db6aa9518ba7c512e5ccd0108 "nix : removed metal for nix (#16118)") | 3 weeks agoOct 6, 2025 |
| [.github](https://github.com/ggml-org/llama.cpp/tree/master/.github ".github") | [.github](https://github.com/ggml-org/llama.cpp/tree/master/.github ".github") | [Add experimental ggml-hexagon backend for the Hexagon NPU (](https://github.com/ggml-org/llama.cpp/commit/63d2fc46e17a06be5b4b5823a5ada088317f1f0a "Add experimental ggml-hexagon backend for the Hexagon NPU (#16547)  * model: add support for extra bufs for all devices  * hexagon: add experimental ggml-hexagon backend for the Hexagon NPU  This commit introduces a new experimental backend `ggml-hexagon` with support for the Hexagon NPU.  Highlights: - Supports Hexagon versions: v73, v75, v79, and v81 - Targets Android devices based on Snapdragon SoCs: Gen3, 8-Elite, and 8-Elite Gen5 - Supports Q4_0, Q8_0, MXFP4, and FP32 data types - Implements core LLM ops: MUL_MAT/MUL_MAT_ID, ADD/SUB/MUL/ADD_ID, RMS_NORM, ROPE, GLU/SWIGLU, SOFTMAX  **Note:** This backend is experimental and may exhibit instability or limited performance across supported devices. It is intended for early testing and feedback from llama.cpp/ggml developer and user community.  Co-Authored-By: Rajdeep Ganguly <rganguly@qti.qualcomm.com> Co-Authored-By: Todor Boinovski <todorb@qti.qualcomm.com>  * hexagon: fix format checker errors  * hexagon: update readme and cmake presets  * ci: add android-ndk-build jobs that build plain ARM64 and Snapdragon versions  * hexagon: add simple graph optimizer for stacking MUL_MAT ops with the same input  * hexagon: move ADB helper scripts into scripts/snapdragon/adb  * hexagon: replace all f/printfs with GGML_LOG_...  * readme: add hexagon to the list supported backends  * hexagon: stack malmuts with quantized inputs only  * hexagon: add TODO for fixing issues in hexagon_graph_optimize  * hexagon: update to hex-sdk 6.4.0 and add scripts for running on QDC  * scripts: fix lint errors  * scripts: update qdc pytest script to make linter happy  * hexagon: add reduce sum in fp32  * hexagon: reduce number of vector stores in matmul output  * hexagon: remove the need for vdelta in reduce-multiply-x8  * hexagon: consistent use of reduce_sum_fp32 for row_sums  * hexagon: some more matmul optimizations and comments  Optimize cases where tensor dims are not multiple of 1024 (e.g in Qwen models). We've handled those cases already but at a higher overhead.  * hexagon: update cmake presets  * hexagon: add OPMASK support for run-bench.sh wrapper  * hexagon: update to use GGML_BACKEND_API  * hexagon: remove unused logic for setting tensor flags for the views  * hexagon: add asserts to set/get_tensor to make sure we handle complete tensors  Same asserts as the CPU backend.  * hexagon: use cpy_tensor slow path for non-host buffers  * hexagon: error checks in the buffer allocator  * cmake: move include(extProj) under ggml-hexagon  * hexagon: don't forget to delete the backend on free  * hexagon: set/get_tensor size assert apply only to quantized tensors  * hexagon: reintroduce HEX_VERBOSE wrapper for GGML_LOG_DEBUG for now  GGML_LOG_DEBUG is always enabled for test-backend-ops and the output gets in the way. Ideally we need a bit more finer log levels.  * docs: typos in hexagon developer docs (libggm-...)  * hexagon: overhaul error handling in the session/device allocation  this should handle all failure paths in the session allocation.  * hexagon: update cmake presets to enable fp16 vectors  * hexagon: remove unused time_usec function  * hexagon: don't forget to release buffer contexts  * hexagon: fixed indents in hvx-utils (missed clang-format auto-format failure)  * hexagon: remove custom can_repeat function and use ggml_can_repeat  ---------  Co-authored-by: Rajdeep Ganguly <rganguly@qti.qualcomm.com> Co-authored-by: Todor Boinovski <todorb@qti.qualcomm.com>") [#16547](https://github.com/ggml-org/llama.cpp/pull/16547) [)](https://github.com/ggml-org/llama.cpp/commit/63d2fc46e17a06be5b4b5823a5ada088317f1f0a "Add experimental ggml-hexagon backend for the Hexagon NPU (#16547)  * model: add support for extra bufs for all devices  * hexagon: add experimental ggml-hexagon backend for the Hexagon NPU  This commit introduces a new experimental backend `ggml-hexagon` with support for the Hexagon NPU.  Highlights: - Supports Hexagon versions: v73, v75, v79, and v81 - Targets Android devices based on Snapdragon SoCs: Gen3, 8-Elite, and 8-Elite Gen5 - Supports Q4_0, Q8_0, MXFP4, and FP32 data types - Implements core LLM ops: MUL_MAT/MUL_MAT_ID, ADD/SUB/MUL/ADD_ID, RMS_NORM, ROPE, GLU/SWIGLU, SOFTMAX  **Note:** This backend is experimental and may exhibit instability or limited performance across supported devices. It is intended for early testing and feedback from llama.cpp/ggml developer and user community.  Co-Authored-By: Rajdeep Ganguly <rganguly@qti.qualcomm.com> Co-Authored-By: Todor Boinovski <todorb@qti.qualcomm.com>  * hexagon: fix format checker errors  * hexagon: update readme and cmake presets  * ci: add android-ndk-build jobs that build plain ARM64 and Snapdragon versions  * hexagon: add simple graph optimizer for stacking MUL_MAT ops with the same input  * hexagon: move ADB helper scripts into scripts/snapdragon/adb  * hexagon: replace all f/printfs with GGML_LOG_...  * readme: add hexagon to the list supported backends  * hexagon: stack malmuts with quantized inputs only  * hexagon: add TODO for fixing issues in hexagon_graph_optimize  * hexagon: update to hex-sdk 6.4.0 and add scripts for running on QDC  * scripts: fix lint errors  * scripts: update qdc pytest script to make linter happy  * hexagon: add reduce sum in fp32  * hexagon: reduce number of vector stores in matmul output  * hexagon: remove the need for vdelta in reduce-multiply-x8  * hexagon: consistent use of reduce_sum_fp32 for row_sums  * hexagon: some more matmul optimizations and comments  Optimize cases where tensor dims are not multiple of 1024 (e.g in Qwen models). We've handled those cases already but at a higher overhead.  * hexagon: update cmake presets  * hexagon: add OPMASK support for run-bench.sh wrapper  * hexagon: update to use GGML_BACKEND_API  * hexagon: remove unused logic for setting tensor flags for the views  * hexagon: add asserts to set/get_tensor to make sure we handle complete tensors  Same asserts as the CPU backend.  * hexagon: use cpy_tensor slow path for non-host buffers  * hexagon: error checks in the buffer allocator  * cmake: move include(extProj) under ggml-hexagon  * hexagon: don't forget to delete the backend on free  * hexagon: set/get_tensor size assert apply only to quantized tensors  * hexagon: reintroduce HEX_VERBOSE wrapper for GGML_LOG_DEBUG for now  GGML_LOG_DEBUG is always enabled for test-backend-ops and the output gets in the way. Ideally we need a bit more finer log levels.  * docs: typos in hexagon developer docs (libggm-...)  * hexagon: overhaul error handling in the session/device allocation  this should handle all failure paths in the session allocation.  * hexagon: update cmake presets to enable fp16 vectors  * hexagon: remove unused time_usec function  * hexagon: don't forget to release buffer contexts  * hexagon: fixed indents in hvx-utils (missed clang-format auto-format failure)  * hexagon: remove custom can_repeat function and use ggml_can_repeat  ---------  Co-authored-by: Rajdeep Ganguly <rganguly@qti.qualcomm.com> Co-authored-by: Todor Boinovski <todorb@qti.qualcomm.com>") | 5 days agoOct 22, 2025 |
| [ci](https://github.com/ggml-org/llama.cpp/tree/master/ci "ci") | [ci](https://github.com/ggml-org/llama.cpp/tree/master/ci "ci") | [HIP: fix GPU\_TARGETS (](https://github.com/ggml-org/llama.cpp/commit/ee09828cb057460b369576410601a3a09279e23c "HIP: fix GPU_TARGETS (#16642)") [#16642](https://github.com/ggml-org/llama.cpp/pull/16642) [)](https://github.com/ggml-org/llama.cpp/commit/ee09828cb057460b369576410601a3a09279e23c "HIP: fix GPU_TARGETS (#16642)") | last weekOct 18, 2025 |
| [cmake](https://github.com/ggml-org/llama.cpp/tree/master/cmake "cmake") | [cmake](https://github.com/ggml-org/llama.cpp/tree/master/cmake "cmake") | [ggml: riscv: add riscv spacemit backend (](https://github.com/ggml-org/llama.cpp/commit/b77e6c18e1a6fac5705ed95f03af5436d67484c1 "ggml: riscv: add riscv spacemit backend (#15288)  * ggml: add spacemit backend  Change-Id: I249bdc043485d815a9c351867137bc1e27cc2e23  * add new line at end of file  Change-Id: I889ed1c85fb45e62350ecde0c06f70450cadfbe2  * add riscv zba extension limit  Change-Id: I321eb200f859751727afe5cae13074dfce2bb0ce  * fixed for review comments, file renamed and format  Change-Id: Ia20b6ec24a36638e62e0fe07cf100916a7cce3ce  * fixed for code format, after clang-format  Change-Id: I5dc33a0412da3d3f2d77075d8939185d3009eca2  * use _Float16 instead of __fp16  Change-Id: I039fb02bb95270e641bc4442204e658735859d43  * add ci for riscv64-spacemit-ime-native  Change-Id: I711c1033061df1a289ea77891b2997599dfe8279  * update debian-13-riscv64-spacemit-ime-native ci label  Change-Id: Ifb2b891e2fca57b5da604fce2ac255f27731179a  * remove license comment for spacemit ime  Change-Id: If0dc3ca30a958631ccca0a28b62e0b825f9fb0c3  * upgrade binutils for gcc ime  Change-Id: Ibf2fa74c1064408974cb5b45f044d40987e5fb45  * add spacemit ime cross jobs  Change-Id: I80d74909941d41cb9cd09e51d8baf01c985cbfc6  * remove native compile for riscv64-spacemit-ime  Change-Id: I01920afafdc73fa7424014fd648d243f8ec9e25e  * ci : add caching for spacemit ime cross toolchain  Change-Id: Ic54a192019a2fd982bbd58225ce3bbc38f4053de  * ci: bug fixed for cache path and env  Change-Id: I28c42e10b6fff053bb6580926ca2353448cb042a  * Update .github/workflows/build-linux-cross.yml for cache path  Co-authored-by: Sigbjørn Skjæret <sigbjorn.skjaeret@scala.com>  * bugfixed for  build-linux-cross.yml,  syntax error  Co-authored-by: Sigbjørn Skjæret <sigbjorn.skjaeret@scala.com>  ---------  Co-authored-by: cailinxi <linxi.cai@spacemit.com> Co-authored-by: Sigbjørn Skjæret <sigbjorn.skjaeret@scala.com>") [#15288](https://github.com/ggml-org/llama.cpp/pull/15288) [)](https://github.com/ggml-org/llama.cpp/commit/b77e6c18e1a6fac5705ed95f03af5436d67484c1 "ggml: riscv: add riscv spacemit backend (#15288)  * ggml: add spacemit backend  Change-Id: I249bdc043485d815a9c351867137bc1e27cc2e23  * add new line at end of file  Change-Id: I889ed1c85fb45e62350ecde0c06f70450cadfbe2  * add riscv zba extension limit  Change-Id: I321eb200f859751727afe5cae13074dfce2bb0ce  * fixed for review comments, file renamed and format  Change-Id: Ia20b6ec24a36638e62e0fe07cf100916a7cce3ce  * fixed for code format, after clang-format  Change-Id: I5dc33a0412da3d3f2d77075d8939185d3009eca2  * use _Float16 instead of __fp16  Change-Id: I039fb02bb95270e641bc4442204e658735859d43  * add ci for riscv64-spacemit-ime-native  Change-Id: I711c1033061df1a289ea77891b2997599dfe8279  * update debian-13-riscv64-spacemit-ime-native ci label  Change-Id: Ifb2b891e2fca57b5da604fce2ac255f27731179a  * remove license comment for spacemit ime  Change-Id: If0dc3ca30a958631ccca0a28b62e0b825f9fb0c3  * upgrade binutils for gcc ime  Change-Id: Ibf2fa74c1064408974cb5b45f044d40987e5fb45  * add spacemit ime cross jobs  Change-Id: I80d74909941d41cb9cd09e51d8baf01c985cbfc6  * remove native compile for riscv64-spacemit-ime  Change-Id: I01920afafdc73fa7424014fd648d243f8ec9e25e  * ci : add caching for spacemit ime cross toolchain  Change-Id: Ic54a192019a2fd982bbd58225ce3bbc38f4053de  * ci: bug fixed for cache path and env  Change-Id: I28c42e10b6fff053bb6580926ca2353448cb042a  * Update .github/workflows/build-linux-cross.yml for cache path  Co-authored-by: Sigbjørn Skjæret <sigbjorn.skjaeret@scala.com>  * bugfixed for  build-linux-cross.yml,  syntax error  Co-authored-by: Sigbjørn Skjæret <sigbjorn.skjaeret@scala.com>  ---------  Co-authored-by: cailinxi <linxi.cai@spacemit.com> Co-authored-by: Sigbjørn Skjæret <sigbjorn.skjaeret@scala.com>") | last monthSep 29, 2025 |
| [common](https://github.com/ggml-org/llama.cpp/tree/master/common "common") | [common](https://github.com/ggml-org/llama.cpp/tree/master/common "common") | [mtmd-cli : allow using --jinja (](https://github.com/ggml-org/llama.cpp/commit/d0660f237a5c31771a3d6d1030ebe3e0c409ba92 "mtmd-cli : allow using --jinja (#16718)  * mtmd-cli : allow using --jinja  * support -sys  * implement chat_history  * fix clear memory  * rm -sys support, added TODO") [#16718](https://github.com/ggml-org/llama.cpp/pull/16718) [)](https://github.com/ggml-org/llama.cpp/commit/d0660f237a5c31771a3d6d1030ebe3e0c409ba92 "mtmd-cli : allow using --jinja (#16718)  * mtmd-cli : allow using --jinja  * support -sys  * implement chat_history  * fix clear memory  * rm -sys support, added TODO") | 4 days agoOct 23, 2025 |
| [docs](https://github.com/ggml-org/llama.cpp/tree/master/docs "docs") | [docs](https://github.com/ggml-org/llama.cpp/tree/master/docs "docs") | [HIP: fix AMDGPU\_TARGETS, update documentation (](https://github.com/ggml-org/llama.cpp/commit/80d28f104c0c3e61c11d6af073642b246a9fc19c "HIP: fix AMDGPU_TARGETS, update documentation (#16803)") [#16803](https://github.com/ggml-org/llama.cpp/pull/16803) [)](https://github.com/ggml-org/llama.cpp/commit/80d28f104c0c3e61c11d6af073642b246a9fc19c "HIP: fix AMDGPU_TARGETS, update documentation (#16803)") | 1 hour agoOct 27, 2025 |
| [examples](https://github.com/ggml-org/llama.cpp/tree/master/examples "examples") | [examples](https://github.com/ggml-org/llama.cpp/tree/master/examples "examples") | [model-conversion : add trust\_remote\_code for orig model run \[no ci\] (](https://github.com/ggml-org/llama.cpp/commit/5a91109a5d7dab5d7adc40bedb397ede99a705b1 "model-conversion : add trust_remote_code for orig model run [no ci] (#16751)  This commit add the trust_remote_code=True argument when loading models using AutoConfig, AutoTokenizer, and AutoModelForCausalLM for the run original model script.  The motivation for this is that some models require custom code to be loaded properly, and setting trust_remote_code=True avoids a prompt asking for user confirmation: ```console (venv) $ make causal-run-original-model The repository /path/to/model contains custom code which must be executed to correctly load the model. You can inspect the repository content at /path/to/model.  Do you wish to run the custom code? [y/N] N ```  Having this as the default seems like a safe choice as we have to clone or download the models we convert and would be expecting to run any custom code they have.") [#…](https://github.com/ggml-org/llama.cpp/pull/16751) | 3 days agoOct 24, 2025 |
| [ggml](https://github.com/ggml-org/llama.cpp/tree/master/ggml "ggml") | [ggml](https://github.com/ggml-org/llama.cpp/tree/master/ggml "ggml") | [ggml : fix interpolate with align-corners and ne=1 (](https://github.com/ggml-org/llama.cpp/commit/10640e31aab0819f31c1e1f2d008b019ee737232 "ggml : fix interpolate with align-corners and ne=1 (#16700)  * ggml : fix interpolate with align-corners and ne=1  * avoid division by zero if one of the spatial dimensions is 1 * cpu, cuda, opencl returned correct result anyway due to clamp * vulkan didn't clamp for align-corners so results were broken  * fix clang warning") [#16700](https://github.com/ggml-org/llama.cpp/pull/16700) [)](https://github.com/ggml-org/llama.cpp/commit/10640e31aab0819f31c1e1f2d008b019ee737232 "ggml : fix interpolate with align-corners and ne=1 (#16700)  * ggml : fix interpolate with align-corners and ne=1  * avoid division by zero if one of the spatial dimensions is 1 * cpu, cuda, opencl returned correct result anyway due to clamp * vulkan didn't clamp for align-corners so results were broken  * fix clang warning") | 1 hour agoOct 27, 2025 |
| [gguf-py](https://github.com/ggml-org/llama.cpp/tree/master/gguf-py "gguf-py") | [gguf-py](https://github.com/ggml-org/llama.cpp/tree/master/gguf-py "gguf-py") | [model : add LightOnOCR-1B model (](https://github.com/ggml-org/llama.cpp/commit/c55d53acec864f64afa1ba92972203dce1bf88f5 "model : add LightOnOCR-1B model (#16764)  * model : add LightOnOCR-1B model  * add test") [#16764](https://github.com/ggml-org/llama.cpp/pull/16764) [)](https://github.com/ggml-org/llama.cpp/commit/c55d53acec864f64afa1ba92972203dce1bf88f5 "model : add LightOnOCR-1B model (#16764)  * model : add LightOnOCR-1B model  * add test") | 6 hours agoOct 27, 2025 |
| [grammars](https://github.com/ggml-org/llama.cpp/tree/master/grammars "grammars") | [grammars](https://github.com/ggml-org/llama.cpp/tree/master/grammars "grammars") | [llama : move end-user examples to tools directory (](https://github.com/ggml-org/llama.cpp/commit/1d36b3670b285e69e58b9d687c770a2a0a192194 "llama : move end-user examples to tools directory (#13249)  * llama : move end-user examples to tools directory  ---------  Co-authored-by: Xuan Son Nguyen <son@huggingface.co>") [#13249](https://github.com/ggml-org/llama.cpp/pull/13249) [)](https://github.com/ggml-org/llama.cpp/commit/1d36b3670b285e69e58b9d687c770a2a0a192194 "llama : move end-user examples to tools directory (#13249)  * llama : move end-user examples to tools directory  ---------  Co-authored-by: Xuan Son Nguyen <son@huggingface.co>") | 6 months agoMay 2, 2025 |
| [include](https://github.com/ggml-org/llama.cpp/tree/master/include "include") | [include](https://github.com/ggml-org/llama.cpp/tree/master/include "include") | [llama : add --no-host to disable host buffers (](https://github.com/ggml-org/llama.cpp/commit/3df2244df40c67dfd6ad548b40ccc507a066af2b "llama : add --no-host to disable host buffers (#16310)  * implement --no-host to disable host buffer  * fix equal_mparams  * move no-host enumeration order together with other model params  ---------  Co-authored-by: slaren <slarengh@gmail.com>") [#16310](https://github.com/ggml-org/llama.cpp/pull/16310) [)](https://github.com/ggml-org/llama.cpp/commit/3df2244df40c67dfd6ad548b40ccc507a066af2b "llama : add --no-host to disable host buffers (#16310)  * implement --no-host to disable host buffer  * fix equal_mparams  * move no-host enumeration order together with other model params  ---------  Co-authored-by: slaren <slarengh@gmail.com>") | 3 weeks agoOct 6, 2025 |
| [licenses](https://github.com/ggml-org/llama.cpp/tree/master/licenses "licenses") | [licenses](https://github.com/ggml-org/llama.cpp/tree/master/licenses "licenses") | [cmake : enable curl by default (](https://github.com/ggml-org/llama.cpp/commit/bd3f59f81289b920bcc597a208c14f55e39ed37e "cmake : enable curl by default (#12761)  * cmake : enable curl by default  * no curl if no examples  * fix build  * fix build-linux-cross  * add windows-setup-curl  * fix  * shell  * fix path  * fix windows-latest-cmake*  * run: include_directories  * LLAMA_RUN_EXTRA_LIBS  * sycl: no llama_curl  * no test-arg-parser on windows  * clarification  * try riscv64 / arm64  * windows: include libcurl inside release binary  * add msg  * fix mac / ios / android build  * will this fix xcode?  * try clearing the cache  * add bunch of licenses  * revert clear cache  * fix xcode  * fix xcode (2)  * fix typo") [#12761](https://github.com/ggml-org/llama.cpp/pull/12761) [)](https://github.com/ggml-org/llama.cpp/commit/bd3f59f81289b920bcc597a208c14f55e39ed37e "cmake : enable curl by default (#12761)  * cmake : enable curl by default  * no curl if no examples  * fix build  * fix build-linux-cross  * add windows-setup-curl  * fix  * shell  * fix path  * fix windows-latest-cmake*  * run: include_directories  * LLAMA_RUN_EXTRA_LIBS  * sycl: no llama_curl  * no test-arg-parser on windows  * clarification  * try riscv64 / arm64  * windows: include libcurl inside release binary  * add msg  * fix mac / ios / android build  * will this fix xcode?  * try clearing the cache  * add bunch of licenses  * revert clear cache  * fix xcode  * fix xcode (2)  * fix typo") | 6 months agoApr 7, 2025 |
| [media](https://github.com/ggml-org/llama.cpp/tree/master/media "media") | [media](https://github.com/ggml-org/llama.cpp/tree/master/media "media") | [media : add transparent icon svg and png \[no ci\] (](https://github.com/ggml-org/llama.cpp/commit/2cfef4d117d67ab1dec002915b48a15d11ee1973 "media : add transparent icon svg and png [no ci] (#15891)") [#15891](https://github.com/ggml-org/llama.cpp/pull/15891) [)](https://github.com/ggml-org/llama.cpp/commit/2cfef4d117d67ab1dec002915b48a15d11ee1973 "media : add transparent icon svg and png [no ci] (#15891)") | last monthSep 10, 2025 |
| [models](https://github.com/ggml-org/llama.cpp/tree/master/models "models") | [models](https://github.com/ggml-org/llama.cpp/tree/master/models "models") | [model : Apertus model implementation (](https://github.com/ggml-org/llama.cpp/commit/34fcc5a4ace8c69476ef2ea3857f39a60334acc4 "model : Apertus model implementation (#15852)  * First attempt  * No permute during convert (fixes qk tensors), proper norm application.  * RoPE = NeoX  * Coherence!  * Migrate xielu params from tensors to hyperparameters  * Simple CUDA kernel  * Revert stupid LLM refactorings  * Chat template support  * configchecker / flake8 errors  * Reorder unary.cu  * I do conclude that LLMs are, in fact, stupid.  * Fix after merge  * Final newline  * Make xIELU an UNARY_OP  * Final newline  * Correctly account for parameter shift  * Argh.  * Update ggml/src/ggml-cpu/unary-ops.cpp  Co-authored-by: Georgi Gerganov <ggerganov@gmail.com>  * Refactor: remove unused methods, inline and factorize softplus, add const modifiers  * Revert CUDA changes, implement xIELU as a separate OP  * Pesky newline  * Add float2half / half2float for F16 inputs/outputs  * CUDA variants, attempt 2  * Actually, attempt 3  * Update ggml/src/ggml-cuda/unary.cu  Co-authored-by: Johannes Gäßler <johannesg@5d6.de>  * Missing convert header  * Proper formula and reference for xIELU in the comments.  * Modify unary-ops.cpp to add the functor-based logic besides the template system to retain optimizations  * Apply suggestions from code review  Co-authored-by: Sigbjørn Skjæret <sigbjorn.skjaeret@scala.com>  * Add tensor mappings for Apertus to global list instead  * Fix lazy on scalars  * Update ggml/src/ggml-cuda/unary.cu  Co-authored-by: Johannes Gäßler <johannesg@5d6.de>  * Add comment about the constraints on positive/negative alpha  * Change `softplus` to `ggml_softplus`  ---------  Co-authored-by: Georgi Gerganov <ggerganov@gmail.com> Co-authored-by: Johannes Gäßler <johannesg@5d6.de> Co-authored-by: Sigbjørn Skjæret <sigbjorn.skjaeret@scala.com>") [#15852](https://github.com/ggml-org/llama.cpp/pull/15852) [)](https://github.com/ggml-org/llama.cpp/commit/34fcc5a4ace8c69476ef2ea3857f39a60334acc4 "model : Apertus model implementation (#15852)  * First attempt  * No permute during convert (fixes qk tensors), proper norm application.  * RoPE = NeoX  * Coherence!  * Migrate xielu params from tensors to hyperparameters  * Simple CUDA kernel  * Revert stupid LLM refactorings  * Chat template support  * configchecker / flake8 errors  * Reorder unary.cu  * I do conclude that LLMs are, in fact, stupid.  * Fix after merge  * Final newline  * Make xIELU an UNARY_OP  * Final newline  * Correctly account for parameter shift  * Argh.  * Update ggml/src/ggml-cpu/unary-ops.cpp  Co-authored-by: Georgi Gerganov <ggerganov@gmail.com>  * Refactor: remove unused methods, inline and factorize softplus, add const modifiers  * Revert CUDA changes, implement xIELU as a separate OP  * Pesky newline  * Add float2half / half2float for F16 inputs/outputs  * CUDA variants, attempt 2  * Actually, attempt 3  * Update ggml/src/ggml-cuda/unary.cu  Co-authored-by: Johannes Gäßler <johannesg@5d6.de>  * Missing convert header  * Proper formula and reference for xIELU in the comments.  * Modify unary-ops.cpp to add the functor-based logic besides the template system to retain optimizations  * Apply suggestions from code review  Co-authored-by: Sigbjørn Skjæret <sigbjorn.skjaeret@scala.com>  * Add tensor mappings for Apertus to global list instead  * Fix lazy on scalars  * Update ggml/src/ggml-cuda/unary.cu  Co-authored-by: Johannes Gäßler <johannesg@5d6.de>  * Add comment about the constraints on positive/negative alpha  * Change `softplus` to `ggml_softplus`  ---------  Co-authored-by: Georgi Gerganov <ggerganov@gmail.com> Co-authored-by: Johannes Gäßler <johannesg@5d6.de> Co-authored-by: Sigbjørn Skjæret <sigbjorn.skjaeret@scala.com>") | last monthOct 2, 2025 |
| [pocs](https://github.com/ggml-org/llama.cpp/tree/master/pocs "pocs") | [pocs](https://github.com/ggml-org/llama.cpp/tree/master/pocs "pocs") | [ggml : move AMX to the CPU backend (](https://github.com/ggml-org/llama.cpp/commit/7cc2d2c88908fc92b97b28acafb82f7d6e425b85 "ggml : move AMX to the CPU backend (#10570)  * ggml : move AMX to the CPU backend  ---------  Co-authored-by: Georgi Gerganov <ggerganov@gmail.com>") [#10570](https://github.com/ggml-org/llama.cpp/pull/10570) [)](https://github.com/ggml-org/llama.cpp/commit/7cc2d2c88908fc92b97b28acafb82f7d6e425b85 "ggml : move AMX to the CPU backend (#10570)  * ggml : move AMX to the CPU backend  ---------  Co-authored-by: Georgi Gerganov <ggerganov@gmail.com>") | 11 months agoNov 29, 2024 |
| [requirements](https://github.com/ggml-org/llama.cpp/tree/master/requirements "requirements") | [requirements](https://github.com/ggml-org/llama.cpp/tree/master/requirements "requirements") | [convert : Make mistral-common dependency optional (](https://github.com/ggml-org/llama.cpp/commit/dd62dcfab97e420949519fd0eac9fca7bf97e635 "convert : Make mistral-common dependency optional (#16738)  * Make mistral-common dependency optional  * Fix typing") [#16738](https://github.com/ggml-org/llama.cpp/pull/16738) [)](https://github.com/ggml-org/llama.cpp/commit/dd62dcfab97e420949519fd0eac9fca7bf97e635 "convert : Make mistral-common dependency optional (#16738)  * Make mistral-common dependency optional  * Fix typing") | 4 days agoOct 23, 2025 |
| [scripts](https://github.com/ggml-org/llama.cpp/tree/master/scripts "scripts") | [scripts](https://github.com/ggml-org/llama.cpp/tree/master/scripts "scripts") | [Add experimental ggml-hexagon backend for the Hexagon NPU (](https://github.com/ggml-org/llama.cpp/commit/63d2fc46e17a06be5b4b5823a5ada088317f1f0a "Add experimental ggml-hexagon backend for the Hexagon NPU (#16547)  * model: add support for extra bufs for all devices  * hexagon: add experimental ggml-hexagon backend for the Hexagon NPU  This commit introduces a new experimental backend `ggml-hexagon` with support for the Hexagon NPU.  Highlights: - Supports Hexagon versions: v73, v75, v79, and v81 - Targets Android devices based on Snapdragon SoCs: Gen3, 8-Elite, and 8-Elite Gen5 - Supports Q4_0, Q8_0, MXFP4, and FP32 data types - Implements core LLM ops: MUL_MAT/MUL_MAT_ID, ADD/SUB/MUL/ADD_ID, RMS_NORM, ROPE, GLU/SWIGLU, SOFTMAX  **Note:** This backend is experimental and may exhibit instability or limited performance across supported devices. It is intended for early testing and feedback from llama.cpp/ggml developer and user community.  Co-Authored-By: Rajdeep Ganguly <rganguly@qti.qualcomm.com> Co-Authored-By: Todor Boinovski <todorb@qti.qualcomm.com>  * hexagon: fix format checker errors  * hexagon: update readme and cmake presets  * ci: add android-ndk-build jobs that build plain ARM64 and Snapdragon versions  * hexagon: add simple graph optimizer for stacking MUL_MAT ops with the same input  * hexagon: move ADB helper scripts into scripts/snapdragon/adb  * hexagon: replace all f/printfs with GGML_LOG_...  * readme: add hexagon to the list supported backends  * hexagon: stack malmuts with quantized inputs only  * hexagon: add TODO for fixing issues in hexagon_graph_optimize  * hexagon: update to hex-sdk 6.4.0 and add scripts for running on QDC  * scripts: fix lint errors  * scripts: update qdc pytest script to make linter happy  * hexagon: add reduce sum in fp32  * hexagon: reduce number of vector stores in matmul output  * hexagon: remove the need for vdelta in reduce-multiply-x8  * hexagon: consistent use of reduce_sum_fp32 for row_sums  * hexagon: some more matmul optimizations and comments  Optimize cases where tensor dims are not multiple of 1024 (e.g in Qwen models). We've handled those cases already but at a higher overhead.  * hexagon: update cmake presets  * hexagon: add OPMASK support for run-bench.sh wrapper  * hexagon: update to use GGML_BACKEND_API  * hexagon: remove unused logic for setting tensor flags for the views  * hexagon: add asserts to set/get_tensor to make sure we handle complete tensors  Same asserts as the CPU backend.  * hexagon: use cpy_tensor slow path for non-host buffers  * hexagon: error checks in the buffer allocator  * cmake: move include(extProj) under ggml-hexagon  * hexagon: don't forget to delete the backend on free  * hexagon: set/get_tensor size assert apply only to quantized tensors  * hexagon: reintroduce HEX_VERBOSE wrapper for GGML_LOG_DEBUG for now  GGML_LOG_DEBUG is always enabled for test-backend-ops and the output gets in the way. Ideally we need a bit more finer log levels.  * docs: typos in hexagon developer docs (libggm-...)  * hexagon: overhaul error handling in the session/device allocation  this should handle all failure paths in the session allocation.  * hexagon: update cmake presets to enable fp16 vectors  * hexagon: remove unused time_usec function  * hexagon: don't forget to release buffer contexts  * hexagon: fixed indents in hvx-utils (missed clang-format auto-format failure)  * hexagon: remove custom can_repeat function and use ggml_can_repeat  ---------  Co-authored-by: Rajdeep Ganguly <rganguly@qti.qualcomm.com> Co-authored-by: Todor Boinovski <todorb@qti.qualcomm.com>") [#16547](https://github.com/ggml-org/llama.cpp/pull/16547) [)](https://github.com/ggml-org/llama.cpp/commit/63d2fc46e17a06be5b4b5823a5ada088317f1f0a "Add experimental ggml-hexagon backend for the Hexagon NPU (#16547)  * model: add support for extra bufs for all devices  * hexagon: add experimental ggml-hexagon backend for the Hexagon NPU  This commit introduces a new experimental backend `ggml-hexagon` with support for the Hexagon NPU.  Highlights: - Supports Hexagon versions: v73, v75, v79, and v81 - Targets Android devices based on Snapdragon SoCs: Gen3, 8-Elite, and 8-Elite Gen5 - Supports Q4_0, Q8_0, MXFP4, and FP32 data types - Implements core LLM ops: MUL_MAT/MUL_MAT_ID, ADD/SUB/MUL/ADD_ID, RMS_NORM, ROPE, GLU/SWIGLU, SOFTMAX  **Note:** This backend is experimental and may exhibit instability or limited performance across supported devices. It is intended for early testing and feedback from llama.cpp/ggml developer and user community.  Co-Authored-By: Rajdeep Ganguly <rganguly@qti.qualcomm.com> Co-Authored-By: Todor Boinovski <todorb@qti.qualcomm.com>  * hexagon: fix format checker errors  * hexagon: update readme and cmake presets  * ci: add android-ndk-build jobs that build plain ARM64 and Snapdragon versions  * hexagon: add simple graph optimizer for stacking MUL_MAT ops with the same input  * hexagon: move ADB helper scripts into scripts/snapdragon/adb  * hexagon: replace all f/printfs with GGML_LOG_...  * readme: add hexagon to the list supported backends  * hexagon: stack malmuts with quantized inputs only  * hexagon: add TODO for fixing issues in hexagon_graph_optimize  * hexagon: update to hex-sdk 6.4.0 and add scripts for running on QDC  * scripts: fix lint errors  * scripts: update qdc pytest script to make linter happy  * hexagon: add reduce sum in fp32  * hexagon: reduce number of vector stores in matmul output  * hexagon: remove the need for vdelta in reduce-multiply-x8  * hexagon: consistent use of reduce_sum_fp32 for row_sums  * hexagon: some more matmul optimizations and comments  Optimize cases where tensor dims are not multiple of 1024 (e.g in Qwen models). We've handled those cases already but at a higher overhead.  * hexagon: update cmake presets  * hexagon: add OPMASK support for run-bench.sh wrapper  * hexagon: update to use GGML_BACKEND_API  * hexagon: remove unused logic for setting tensor flags for the views  * hexagon: add asserts to set/get_tensor to make sure we handle complete tensors  Same asserts as the CPU backend.  * hexagon: use cpy_tensor slow path for non-host buffers  * hexagon: error checks in the buffer allocator  * cmake: move include(extProj) under ggml-hexagon  * hexagon: don't forget to delete the backend on free  * hexagon: set/get_tensor size assert apply only to quantized tensors  * hexagon: reintroduce HEX_VERBOSE wrapper for GGML_LOG_DEBUG for now  GGML_LOG_DEBUG is always enabled for test-backend-ops and the output gets in the way. Ideally we need a bit more finer log levels.  * docs: typos in hexagon developer docs (libggm-...)  * hexagon: overhaul error handling in the session/device allocation  this should handle all failure paths in the session allocation.  * hexagon: update cmake presets to enable fp16 vectors  * hexagon: remove unused time_usec function  * hexagon: don't forget to release buffer contexts  * hexagon: fixed indents in hvx-utils (missed clang-format auto-format failure)  * hexagon: remove custom can_repeat function and use ggml_can_repeat  ---------  Co-authored-by: Rajdeep Ganguly <rganguly@qti.qualcomm.com> Co-authored-by: Todor Boinovski <todorb@qti.qualcomm.com>") | 5 days agoOct 22, 2025 |
| [src](https://github.com/ggml-org/llama.cpp/tree/master/src "src") | [src](https://github.com/ggml-org/llama.cpp/tree/master/src "src") | [llama : disable pipeline parallelism if compute buffer allocation fai…](https://github.com/ggml-org/llama.cpp/commit/5a4ff43e7dd049e35942bc3d12361dab2f155544 "llama : disable pipeline parallelism if compute buffer allocation fails (#16748)") | 1 hour agoOct 27, 2025 |
| [tests](https://github.com/ggml-org/llama.cpp/tree/master/tests "tests") | [tests](https://github.com/ggml-org/llama.cpp/tree/master/tests "tests") | [ggml : fix interpolate with align-corners and ne=1 (](https://github.com/ggml-org/llama.cpp/commit/10640e31aab0819f31c1e1f2d008b019ee737232 "ggml : fix interpolate with align-corners and ne=1 (#16700)  * ggml : fix interpolate with align-corners and ne=1  * avoid division by zero if one of the spatial dimensions is 1 * cpu, cuda, opencl returned correct result anyway due to clamp * vulkan didn't clamp for align-corners so results were broken  * fix clang warning") [#16700](https://github.com/ggml-org/llama.cpp/pull/16700) [)](https://github.com/ggml-org/llama.cpp/commit/10640e31aab0819f31c1e1f2d008b019ee737232 "ggml : fix interpolate with align-corners and ne=1 (#16700)  * ggml : fix interpolate with align-corners and ne=1  * avoid division by zero if one of the spatial dimensions is 1 * cpu, cuda, opencl returned correct result anyway due to clamp * vulkan didn't clamp for align-corners so results were broken  * fix clang warning") | 1 hour agoOct 27, 2025 |
| [tools](https://github.com/ggml-org/llama.cpp/tree/master/tools "tools") | [tools](https://github.com/ggml-org/llama.cpp/tree/master/tools "tools") | [model : add LightOnOCR-1B model (](https://github.com/ggml-org/llama.cpp/commit/c55d53acec864f64afa1ba92972203dce1bf88f5 "model : add LightOnOCR-1B model (#16764)  * model : add LightOnOCR-1B model  * add test") [#16764](https://github.com/ggml-org/llama.cpp/pull/16764) [)](https://github.com/ggml-org/llama.cpp/commit/c55d53acec864f64afa1ba92972203dce1bf88f5 "model : add LightOnOCR-1B model (#16764)  * model : add LightOnOCR-1B model  * add test") | 6 hours agoOct 27, 2025 |
| [vendor](https://github.com/ggml-org/llama.cpp/tree/master/vendor "vendor") | [vendor](https://github.com/ggml-org/llama.cpp/tree/master/vendor "vendor") | [common : use cpp-httplib as a cURL alternative for downloads (](https://github.com/ggml-org/llama.cpp/commit/b995a10760cb93d23d617d76ecb82a5f95b5e0d3 "common : use cpp-httplib as a cURL alternative for downloads (#16185)  * vendor : update httplib  Signed-off-by: Adrien Gallouët <angt@huggingface.co>  * common : use cpp-httplib as a cURL alternative for downloads  The existing cURL implementation is intentionally left untouched to prevent any regressions and to allow for safe, side-by-side testing by toggling the `LLAMA_CURL` CMake option.  Signed-off-by: Adrien Gallouët <angt@huggingface.co>  * ggml : Bump to Windows 10  Signed-off-by: Adrien Gallouët <angt@huggingface.co>  ---------  Signed-off-by: Adrien Gallouët <angt@huggingface.co>") [#16185](https://github.com/ggml-org/llama.cpp/pull/16185) [)](https://github.com/ggml-org/llama.cpp/commit/b995a10760cb93d23d617d76ecb82a5f95b5e0d3 "common : use cpp-httplib as a cURL alternative for downloads (#16185)  * vendor : update httplib  Signed-off-by: Adrien Gallouët <angt@huggingface.co>  * common : use cpp-httplib as a cURL alternative for downloads  The existing cURL implementation is intentionally left untouched to prevent any regressions and to allow for safe, side-by-side testing by toggling the `LLAMA_CURL` CMake option.  Signed-off-by: Adrien Gallouët <angt@huggingface.co>  * ggml : Bump to Windows 10  Signed-off-by: Adrien Gallouët <angt@huggingface.co>  ---------  Signed-off-by: Adrien Gallouët <angt@huggingface.co>") | last monthSep 26, 2025 |
| [.clang-format](https://github.com/ggml-org/llama.cpp/blob/master/.clang-format ".clang-format") | [.clang-format](https://github.com/ggml-org/llama.cpp/blob/master/.clang-format ".clang-format") | [fix: apply clang-format to CUDA macros (](https://github.com/ggml-org/llama.cpp/commit/f1fbffb5c0b34b2a68febb7da3fd0f8333f1ed4c "fix: apply clang-format to CUDA macros (#16017)  clang-format previously broke long CUDA macros (e.g. __launch_bounds__) into unreadable line breaks inside template declarations, such as:    template<int D, int ncols, int nwarps, int VKQ_stride,            typename KQ_acc_t, bool use_logit_softcap>       __launch_bounds__(nwarps*ggml_cuda_get_physical_warp_size(), 1)  This change adjusts formatting rules so that CUDA macros remain consistent and aligned with the surrounding template syntax.") [#16017](https://github.com/ggml-org/llama.cpp/pull/16017) [)](https://github.com/ggml-org/llama.cpp/commit/f1fbffb5c0b34b2a68febb7da3fd0f8333f1ed4c "fix: apply clang-format to CUDA macros (#16017)  clang-format previously broke long CUDA macros (e.g. __launch_bounds__) into unreadable line breaks inside template declarations, such as:    template<int D, int ncols, int nwarps, int VKQ_stride,            typename KQ_acc_t, bool use_logit_softcap>       __launch_bounds__(nwarps*ggml_cuda_get_physical_warp_size(), 1)  This change adjusts formatting rules so that CUDA macros remain consistent and aligned with the surrounding template syntax.") | last monthSep 16, 2025 |
| [.clang-tidy](https://github.com/ggml-org/llama.cpp/blob/master/.clang-tidy ".clang-tidy") | [.clang-tidy](https://github.com/ggml-org/llama.cpp/blob/master/.clang-tidy ".clang-tidy") | [clang-tidy : disable warning about performance enum size (](https://github.com/ggml-org/llama.cpp/commit/351f3da39c85f59d581fc184f09283da7f099a3b "clang-tidy : disable warning about performance enum size (#16127)  Disable 'performance-enum-size' checking:  Enum 'llama_token_type' uses a larger base type ('unsigned int', size: 4 bytes) than necessary for its value set, consider using 'std::uint8_t' (1 byte) as the base type to reduce its size.") [#16127](https://github.com/ggml-org/llama.cpp/pull/16127) [)](https://github.com/ggml-org/llama.cpp/commit/351f3da39c85f59d581fc184f09283da7f099a3b "clang-tidy : disable warning about performance enum size (#16127)  Disable 'performance-enum-size' checking:  Enum 'llama_token_type' uses a larger base type ('unsigned int', size: 4 bytes) than necessary for its value set, consider using 'std::uint8_t' (1 byte) as the base type to reduce its size.") | last monthSep 22, 2025 |
| [.dockerignore](https://github.com/ggml-org/llama.cpp/blob/master/.dockerignore ".dockerignore") | [.dockerignore](https://github.com/ggml-org/llama.cpp/blob/master/.dockerignore ".dockerignore") | [ci : fix docker build number and tag name (](https://github.com/ggml-org/llama.cpp/commit/ea9c32be71b91b42ecc538bd902e93cbb5fb36cb "ci : fix docker build number and tag name (#9638)  * ci : fix docker build number and tag name  * fine-grant permissions") [#9638](https://github.com/ggml-org/llama.cpp/pull/9638) [)](https://github.com/ggml-org/llama.cpp/commit/ea9c32be71b91b42ecc538bd902e93cbb5fb36cb "ci : fix docker build number and tag name (#9638)  * ci : fix docker build number and tag name  * fine-grant permissions") | last yearSep 25, 2024 |
| [.ecrc](https://github.com/ggml-org/llama.cpp/blob/master/.ecrc ".ecrc") | [.ecrc](https://github.com/ggml-org/llama.cpp/blob/master/.ecrc ".ecrc") | [common : Update stb\_image.h to latest version (](https://github.com/ggml-org/llama.cpp/commit/ad76569f8e78ab6ca921bda25cef25a157361719 "common : Update stb_image.h to latest version (#9161)  * Update stb_image.h to latest version  Fixes https://github.com/ggerganov/llama.cpp/issues/7431  * Update .ecrc") [#9161](https://github.com/ggml-org/llama.cpp/pull/9161) [)](https://github.com/ggml-org/llama.cpp/commit/ad76569f8e78ab6ca921bda25cef25a157361719 "common : Update stb_image.h to latest version (#9161)  * Update stb_image.h to latest version  Fixes https://github.com/ggerganov/llama.cpp/issues/7431  * Update .ecrc") | last yearAug 27, 2024 |
| [.editorconfig](https://github.com/ggml-org/llama.cpp/blob/master/.editorconfig ".editorconfig") | [.editorconfig](https://github.com/ggml-org/llama.cpp/blob/master/.editorconfig ".editorconfig") | [SvelteKit-based WebUI (](https://github.com/ggml-org/llama.cpp/commit/a7a98e0fffed794396b3fbad4dcdbbc184963645 "SvelteKit-based WebUI (#14839)") [#14839](https://github.com/ggml-org/llama.cpp/pull/14839) [)](https://github.com/ggml-org/llama.cpp/commit/a7a98e0fffed794396b3fbad4dcdbbc184963645 "SvelteKit-based WebUI (#14839)") | last monthSep 17, 2025 |
| [.flake8](https://github.com/ggml-org/llama.cpp/blob/master/.flake8 ".flake8") | [.flake8](https://github.com/ggml-org/llama.cpp/blob/master/.flake8 ".flake8") | [llama : move end-user examples to tools directory (](https://github.com/ggml-org/llama.cpp/commit/1d36b3670b285e69e58b9d687c770a2a0a192194 "llama : move end-user examples to tools directory (#13249)  * llama : move end-user examples to tools directory  ---------  Co-authored-by: Xuan Son Nguyen <son@huggingface.co>") [#13249](https://github.com/ggml-org/llama.cpp/pull/13249) [)](https://github.com/ggml-org/llama.cpp/commit/1d36b3670b285e69e58b9d687c770a2a0a192194 "llama : move end-user examples to tools directory (#13249)  * llama : move end-user examples to tools directory  ---------  Co-authored-by: Xuan Son Nguyen <son@huggingface.co>") | 6 months agoMay 2, 2025 |
| [.gitignore](https://github.com/ggml-org/llama.cpp/blob/master/.gitignore ".gitignore") | [.gitignore](https://github.com/ggml-org/llama.cpp/blob/master/.gitignore ".gitignore") | [Always show message actions for mobile UI + improvements for user mes…](https://github.com/ggml-org/llama.cpp/commit/5d0a40f390732cbf85d8a3b7b0fc3cbebffe780a "Always show message actions for mobile UI + improvements for user message sizing (#16076)") | last monthSep 26, 2025 |
| [.gitmodules](https://github.com/ggml-org/llama.cpp/blob/master/.gitmodules ".gitmodules") | [.gitmodules](https://github.com/ggml-org/llama.cpp/blob/master/.gitmodules ".gitmodules") | [ggml : remove kompute backend (](https://github.com/ggml-org/llama.cpp/commit/d4cdd9c1c3cebdafca735958597de4ff7b7c0f54 "ggml : remove kompute backend (#14501)  ggml-ci") [#14501](https://github.com/ggml-org/llama.cpp/pull/14501) [)](https://github.com/ggml-org/llama.cpp/commit/d4cdd9c1c3cebdafca735958597de4ff7b7c0f54 "ggml : remove kompute backend (#14501)  ggml-ci") | 4 months agoJul 3, 2025 |
| [.pre-commit-config.yaml](https://github.com/ggml-org/llama.cpp/blob/master/.pre-commit-config.yaml ".pre-commit-config.yaml") | [.pre-commit-config.yaml](https://github.com/ggml-org/llama.cpp/blob/master/.pre-commit-config.yaml ".pre-commit-config.yaml") | [convert.py : add python logging instead of print() (](https://github.com/ggml-org/llama.cpp/commit/a2ac89d6efb41b535778bfeaecaae8fe295b6ed3 "convert.py : add python logging instead of print() (#6511)  * convert.py: add python logging instead of print()  * convert.py: verbose flag takes priority over dump flag log suppression  * convert.py: named instance logging  * convert.py: use explicit logger id string  * convert.py: convert extra print() to named logger  * convert.py: sys.stderr.write --> logger.error  * *.py: Convert all python scripts to use logging module  * requirements.txt: remove extra line  * flake8: update flake8 ignore and exclude to match ci settings  * gh-actions: add flake8-no-print to flake8 lint step  * pre-commit: add flake8-no-print to flake8 and also update pre-commit version  * convert-hf-to-gguf.py: print() to logger conversion  * *.py: logging basiconfig refactor to use conditional expression  * *.py: removed commented out logging  * fixup! *.py: logging basiconfig refactor to use conditional expression  * constant.py: logger.error then exit should be a raise exception instead  * *.py: Convert logger error and sys.exit() into a raise exception (for atypical error)  * gguf-convert-endian.py: refactor convert_byteorder() to use tqdm progressbar  * verify-checksum-model.py: This is the result of the program, it should be printed to stdout.  * compare-llama-bench.py: add blank line for readability during missing repo response  * reader.py: read_gguf_file() use print() over logging  * convert.py: warning goes to stderr and won't hurt the dump output  * gguf-dump.py: dump_metadata() should print to stdout  * convert-hf-to-gguf.py: print --> logger.debug or ValueError()  * verify-checksum-models.py: use print() for printing table  * *.py: refactor logging.basicConfig()  * gguf-py/gguf/*.py: use __name__ as logger name  Since they will be imported and not run directly.  * python-lint.yml: use .flake8 file instead  * constants.py: logger no longer required  * convert-hf-to-gguf.py: add additional logging  * convert-hf-to-gguf.py: print() --> logger  * *.py: fix flake8 warnings  * revert changes to convert-hf-to-gguf.py for get_name()  * convert-hf-to-gguf-update.py: use triple quoted f-string instead  * *.py: accidentally corrected the wrong line  * *.py: add compilade warning suggestions and style fixes") [#6511](https://github.com/ggml-org/llama.cpp/pull/6511) [)](https://github.com/ggml-org/llama.cpp/commit/a2ac89d6efb41b535778bfeaecaae8fe295b6ed3 "convert.py : add python logging instead of print() (#6511)  * convert.py: add python logging instead of print()  * convert.py: verbose flag takes priority over dump flag log suppression  * convert.py: named instance logging  * convert.py: use explicit logger id string  * convert.py: convert extra print() to named logger  * convert.py: sys.stderr.write --> logger.error  * *.py: Convert all python scripts to use logging module  * requirements.txt: remove extra line  * flake8: update flake8 ignore and exclude to match ci settings  * gh-actions: add flake8-no-print to flake8 lint step  * pre-commit: add flake8-no-print to flake8 and also update pre-commit version  * convert-hf-to-gguf.py: print() to logger conversion  * *.py: logging basiconfig refactor to use conditional expression  * *.py: removed commented out logging  * fixup! *.py: logging basiconfig refactor to use conditional expression  * constant.py: logger.error then exit should be a raise exception instead  * *.py: Convert logger error and sys.exit() into a raise exception (for atypical error)  * gguf-convert-endian.py: refactor convert_byteorder() to use tqdm progressbar  * verify-checksum-model.py: This is the result of the program, it should be printed to stdout.  * compare-llama-bench.py: add blank line for readability during missing repo response  * reader.py: read_gguf_file() use print() over logging  * convert.py: warning goes to stderr and won't hurt the dump output  * gguf-dump.py: dump_metadata() should print to stdout  * convert-hf-to-gguf.py: print --> logger.debug or ValueError()  * verify-checksum-models.py: use print() for printing table  * *.py: refactor logging.basicConfig()  * gguf-py/gguf/*.py: use __name__ as logger name  Since they will be imported and not run directly.  * python-lint.yml: use .flake8 file instead  * constants.py: logger no longer required  * convert-hf-to-gguf.py: add additional logging  * convert-hf-to-gguf.py: print() --> logger  * *.py: fix flake8 warnings  * revert changes to convert-hf-to-gguf.py for get_name()  * convert-hf-to-gguf-update.py: use triple quoted f-string instead  * *.py: accidentally corrected the wrong line  * *.py: add compilade warning suggestions and style fixes") | last yearMay 3, 2024 |
| [AUTHORS](https://github.com/ggml-org/llama.cpp/blob/master/AUTHORS "AUTHORS") | [AUTHORS](https://github.com/ggml-org/llama.cpp/blob/master/AUTHORS "AUTHORS") | [authors : update (](https://github.com/ggml-org/llama.cpp/commit/0fd7ca7a210bd4abc995cd728491043491dbdef7 "authors : update (#12271)") [#12271](https://github.com/ggml-org/llama.cpp/pull/12271) [)](https://github.com/ggml-org/llama.cpp/commit/0fd7ca7a210bd4abc995cd728491043491dbdef7 "authors : update (#12271)") | 7 months agoMar 8, 2025 |
| [CMakeLists.txt](https://github.com/ggml-org/llama.cpp/blob/master/CMakeLists.txt "CMakeLists.txt") | [CMakeLists.txt](https://github.com/ggml-org/llama.cpp/blob/master/CMakeLists.txt "CMakeLists.txt") | [server : remove old LLAMA\_SERVER\_SSL (](https://github.com/ggml-org/llama.cpp/commit/234e2ff8ed09716fb553437596779399bee31b11 "server : remove old LLAMA_SERVER_SSL (#16290)  Signed-off-by: Adrien Gallouët <angt@huggingface.co>") [#16290](https://github.com/ggml-org/llama.cpp/pull/16290) [)](https://github.com/ggml-org/llama.cpp/commit/234e2ff8ed09716fb553437596779399bee31b11 "server : remove old LLAMA_SERVER_SSL (#16290)  Signed-off-by: Adrien Gallouët <angt@huggingface.co>") | last monthSep 27, 2025 |
| [CMakePresets.json](https://github.com/ggml-org/llama.cpp/blob/master/CMakePresets.json "CMakePresets.json") | [CMakePresets.json](https://github.com/ggml-org/llama.cpp/blob/master/CMakePresets.json "CMakePresets.json") | [cmake : Add CMake presets for Linux and GCC (](https://github.com/ggml-org/llama.cpp/commit/84b396e0510855a95d591afdf1f21c562cb3712a "cmake : Add CMake presets for Linux and GCC (#14656)") [#14656](https://github.com/ggml-org/llama.cpp/pull/14656) [)](https://github.com/ggml-org/llama.cpp/commit/84b396e0510855a95d591afdf1f21c562cb3712a "cmake : Add CMake presets for Linux and GCC (#14656)") | 3 months agoJul 13, 2025 |
| [CODEOWNERS](https://github.com/ggml-org/llama.cpp/blob/master/CODEOWNERS "CODEOWNERS") | [CODEOWNERS](https://github.com/ggml-org/llama.cpp/blob/master/CODEOWNERS "CODEOWNERS") | [Add experimental ggml-hexagon backend for the Hexagon NPU (](https://github.com/ggml-org/llama.cpp/commit/63d2fc46e17a06be5b4b5823a5ada088317f1f0a "Add experimental ggml-hexagon backend for the Hexagon NPU (#16547)  * model: add support for extra bufs for all devices  * hexagon: add experimental ggml-hexagon backend for the Hexagon NPU  This commit introduces a new experimental backend `ggml-hexagon` with support for the Hexagon NPU.  Highlights: - Supports Hexagon versions: v73, v75, v79, and v81 - Targets Android devices based on Snapdragon SoCs: Gen3, 8-Elite, and 8-Elite Gen5 - Supports Q4_0, Q8_0, MXFP4, and FP32 data types - Implements core LLM ops: MUL_MAT/MUL_MAT_ID, ADD/SUB/MUL/ADD_ID, RMS_NORM, ROPE, GLU/SWIGLU, SOFTMAX  **Note:** This backend is experimental and may exhibit instability or limited performance across supported devices. It is intended for early testing and feedback from llama.cpp/ggml developer and user community.  Co-Authored-By: Rajdeep Ganguly <rganguly@qti.qualcomm.com> Co-Authored-By: Todor Boinovski <todorb@qti.qualcomm.com>  * hexagon: fix format checker errors  * hexagon: update readme and cmake presets  * ci: add android-ndk-build jobs that build plain ARM64 and Snapdragon versions  * hexagon: add simple graph optimizer for stacking MUL_MAT ops with the same input  * hexagon: move ADB helper scripts into scripts/snapdragon/adb  * hexagon: replace all f/printfs with GGML_LOG_...  * readme: add hexagon to the list supported backends  * hexagon: stack malmuts with quantized inputs only  * hexagon: add TODO for fixing issues in hexagon_graph_optimize  * hexagon: update to hex-sdk 6.4.0 and add scripts for running on QDC  * scripts: fix lint errors  * scripts: update qdc pytest script to make linter happy  * hexagon: add reduce sum in fp32  * hexagon: reduce number of vector stores in matmul output  * hexagon: remove the need for vdelta in reduce-multiply-x8  * hexagon: consistent use of reduce_sum_fp32 for row_sums  * hexagon: some more matmul optimizations and comments  Optimize cases where tensor dims are not multiple of 1024 (e.g in Qwen models). We've handled those cases already but at a higher overhead.  * hexagon: update cmake presets  * hexagon: add OPMASK support for run-bench.sh wrapper  * hexagon: update to use GGML_BACKEND_API  * hexagon: remove unused logic for setting tensor flags for the views  * hexagon: add asserts to set/get_tensor to make sure we handle complete tensors  Same asserts as the CPU backend.  * hexagon: use cpy_tensor slow path for non-host buffers  * hexagon: error checks in the buffer allocator  * cmake: move include(extProj) under ggml-hexagon  * hexagon: don't forget to delete the backend on free  * hexagon: set/get_tensor size assert apply only to quantized tensors  * hexagon: reintroduce HEX_VERBOSE wrapper for GGML_LOG_DEBUG for now  GGML_LOG_DEBUG is always enabled for test-backend-ops and the output gets in the way. Ideally we need a bit more finer log levels.  * docs: typos in hexagon developer docs (libggm-...)  * hexagon: overhaul error handling in the session/device allocation  this should handle all failure paths in the session allocation.  * hexagon: update cmake presets to enable fp16 vectors  * hexagon: remove unused time_usec function  * hexagon: don't forget to release buffer contexts  * hexagon: fixed indents in hvx-utils (missed clang-format auto-format failure)  * hexagon: remove custom can_repeat function and use ggml_can_repeat  ---------  Co-authored-by: Rajdeep Ganguly <rganguly@qti.qualcomm.com> Co-authored-by: Todor Boinovski <todorb@qti.qualcomm.com>") [#16547](https://github.com/ggml-org/llama.cpp/pull/16547) [)](https://github.com/ggml-org/llama.cpp/commit/63d2fc46e17a06be5b4b5823a5ada088317f1f0a "Add experimental ggml-hexagon backend for the Hexagon NPU (#16547)  * model: add support for extra bufs for all devices  * hexagon: add experimental ggml-hexagon backend for the Hexagon NPU  This commit introduces a new experimental backend `ggml-hexagon` with support for the Hexagon NPU.  Highlights: - Supports Hexagon versions: v73, v75, v79, and v81 - Targets Android devices based on Snapdragon SoCs: Gen3, 8-Elite, and 8-Elite Gen5 - Supports Q4_0, Q8_0, MXFP4, and FP32 data types - Implements core LLM ops: MUL_MAT/MUL_MAT_ID, ADD/SUB/MUL/ADD_ID, RMS_NORM, ROPE, GLU/SWIGLU, SOFTMAX  **Note:** This backend is experimental and may exhibit instability or limited performance across supported devices. It is intended for early testing and feedback from llama.cpp/ggml developer and user community.  Co-Authored-By: Rajdeep Ganguly <rganguly@qti.qualcomm.com> Co-Authored-By: Todor Boinovski <todorb@qti.qualcomm.com>  * hexagon: fix format checker errors  * hexagon: update readme and cmake presets  * ci: add android-ndk-build jobs that build plain ARM64 and Snapdragon versions  * hexagon: add simple graph optimizer for stacking MUL_MAT ops with the same input  * hexagon: move ADB helper scripts into scripts/snapdragon/adb  * hexagon: replace all f/printfs with GGML_LOG_...  * readme: add hexagon to the list supported backends  * hexagon: stack malmuts with quantized inputs only  * hexagon: add TODO for fixing issues in hexagon_graph_optimize  * hexagon: update to hex-sdk 6.4.0 and add scripts for running on QDC  * scripts: fix lint errors  * scripts: update qdc pytest script to make linter happy  * hexagon: add reduce sum in fp32  * hexagon: reduce number of vector stores in matmul output  * hexagon: remove the need for vdelta in reduce-multiply-x8  * hexagon: consistent use of reduce_sum_fp32 for row_sums  * hexagon: some more matmul optimizations and comments  Optimize cases where tensor dims are not multiple of 1024 (e.g in Qwen models). We've handled those cases already but at a higher overhead.  * hexagon: update cmake presets  * hexagon: add OPMASK support for run-bench.sh wrapper  * hexagon: update to use GGML_BACKEND_API  * hexagon: remove unused logic for setting tensor flags for the views  * hexagon: add asserts to set/get_tensor to make sure we handle complete tensors  Same asserts as the CPU backend.  * hexagon: use cpy_tensor slow path for non-host buffers  * hexagon: error checks in the buffer allocator  * cmake: move include(extProj) under ggml-hexagon  * hexagon: don't forget to delete the backend on free  * hexagon: set/get_tensor size assert apply only to quantized tensors  * hexagon: reintroduce HEX_VERBOSE wrapper for GGML_LOG_DEBUG for now  GGML_LOG_DEBUG is always enabled for test-backend-ops and the output gets in the way. Ideally we need a bit more finer log levels.  * docs: typos in hexagon developer docs (libggm-...)  * hexagon: overhaul error handling in the session/device allocation  this should handle all failure paths in the session allocation.  * hexagon: update cmake presets to enable fp16 vectors  * hexagon: remove unused time_usec function  * hexagon: don't forget to release buffer contexts  * hexagon: fixed indents in hvx-utils (missed clang-format auto-format failure)  * hexagon: remove custom can_repeat function and use ggml_can_repeat  ---------  Co-authored-by: Rajdeep Ganguly <rganguly@qti.qualcomm.com> Co-authored-by: Todor Boinovski <todorb@qti.qualcomm.com>") | 5 days agoOct 22, 2025 |
| [CONTRIBUTING.md](https://github.com/ggml-org/llama.cpp/blob/master/CONTRIBUTING.md "CONTRIBUTING.md") | [CONTRIBUTING.md](https://github.com/ggml-org/llama.cpp/blob/master/CONTRIBUTING.md "CONTRIBUTING.md") | [docs: fix typo \[no ci\] (](https://github.com/ggml-org/llama.cpp/commit/4cdd0bb4537f9617e9efcfef6b9454fcefe2ff08 "docs: fix typo [no ci] (#16244)") [#16244](https://github.com/ggml-org/llama.cpp/pull/16244) [)](https://github.com/ggml-org/llama.cpp/commit/4cdd0bb4537f9617e9efcfef6b9454fcefe2ff08 "docs: fix typo [no ci] (#16244)") | last monthSep 25, 2025 |
| [LICENSE](https://github.com/ggml-org/llama.cpp/blob/master/LICENSE "LICENSE") | [LICENSE](https://github.com/ggml-org/llama.cpp/blob/master/LICENSE "LICENSE") | [license : update copyright notice + add AUTHORS (](https://github.com/ggml-org/llama.cpp/commit/e11a8999b5690f810c2c99c14347f0834e68c524 "license : update copyright notice + add AUTHORS (#6405)  * license : add AUTHORS  * authors : update  * scipts : add LICENSE and gen-authors.sh to sync") [#6405](https://github.com/ggml-org/llama.cpp/pull/6405) [)](https://github.com/ggml-org/llama.cpp/commit/e11a8999b5690f810c2c99c14347f0834e68c524 "license : update copyright notice + add AUTHORS (#6405)  * license : add AUTHORS  * authors : update  * scipts : add LICENSE and gen-authors.sh to sync") | last yearApr 9, 2024 |
| [Makefile](https://github.com/ggml-org/llama.cpp/blob/master/Makefile "Makefile") | [Makefile](https://github.com/ggml-org/llama.cpp/blob/master/Makefile "Makefile") | [make : remove make in favor of CMake (](https://github.com/ggml-org/llama.cpp/commit/37f10f955f70e0158d50343d0b9a3f92d194daae "make : remove make in favor of CMake (#15449)  This commit removes the content from the Makefile and updates the current deprecation message to information that `make` has been replaced by CMake instead.  The message when `make` is invoked will now be the following: ```console $ make Makefile:6: *** Build system changed:  The Makefile build has been replaced by CMake.   For build instructions see:  https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md  .  Stop. ```  The motivation for this is that many, if not all targets fail to build now, after changes to the system, and `make` has also been deprected for some time now.") [#15449](https://github.com/ggml-org/llama.cpp/pull/15449) [)](https://github.com/ggml-org/llama.cpp/commit/37f10f955f70e0158d50343d0b9a3f92d194daae "make : remove make in favor of CMake (#15449)  This commit removes the content from the Makefile and updates the current deprecation message to information that `make` has been replaced by CMake instead.  The message when `make` is invoked will now be the following: ```console $ make Makefile:6: *** Build system changed:  The Makefile build has been replaced by CMake.   For build instructions see:  https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md  .  Stop. ```  The motivation for this is that many, if not all targets fail to build now, after changes to the system, and `make` has also been deprected for some time now.") | 2 months agoAug 20, 2025 |
| [README.md](https://github.com/ggml-org/llama.cpp/blob/master/README.md "README.md") | [README.md](https://github.com/ggml-org/llama.cpp/blob/master/README.md "README.md") | [docs : add Jamba to Text-only models list (](https://github.com/ggml-org/llama.cpp/commit/8d8862829cd770fc9c0c7a726ed162de824ff5ea "docs : add Jamba to Text-only models list (#16778)") [#16778](https://github.com/ggml-org/llama.cpp/pull/16778) [)](https://github.com/ggml-org/llama.cpp/commit/8d8862829cd770fc9c0c7a726ed162de824ff5ea "docs : add Jamba to Text-only models list (#16778)") | yesterdayOct 26, 2025 |
| [SECURITY.md](https://github.com/ggml-org/llama.cpp/blob/master/SECURITY.md "SECURITY.md") | [SECURITY.md](https://github.com/ggml-org/llama.cpp/blob/master/SECURITY.md "SECURITY.md") | [llama : move end-user examples to tools directory (](https://github.com/ggml-org/llama.cpp/commit/1d36b3670b285e69e58b9d687c770a2a0a192194 "llama : move end-user examples to tools directory (#13249)  * llama : move end-user examples to tools directory  ---------  Co-authored-by: Xuan Son Nguyen <son@huggingface.co>") [#13249](https://github.com/ggml-org/llama.cpp/pull/13249) [)](https://github.com/ggml-org/llama.cpp/commit/1d36b3670b285e69e58b9d687c770a2a0a192194 "llama : move end-user examples to tools directory (#13249)  * llama : move end-user examples to tools directory  ---------  Co-authored-by: Xuan Son Nguyen <son@huggingface.co>") | 6 months agoMay 2, 2025 |
| [build-xcframework.sh](https://github.com/ggml-org/llama.cpp/blob/master/build-xcframework.sh "build-xcframework.sh") | [build-xcframework.sh](https://github.com/ggml-org/llama.cpp/blob/master/build-xcframework.sh "build-xcframework.sh") | [build : fix build-ios-device (](https://github.com/ggml-org/llama.cpp/commit/4710dd31bbcef79d04f85a3a6a8c7d9439c5c79a "build : fix build-ios-device (#16257)  Signed-off-by: Adrien Gallouët <angt@huggingface.co>") [#16257](https://github.com/ggml-org/llama.cpp/pull/16257) [)](https://github.com/ggml-org/llama.cpp/commit/4710dd31bbcef79d04f85a3a6a8c7d9439c5c79a "build : fix build-ios-device (#16257)  Signed-off-by: Adrien Gallouët <angt@huggingface.co>") | last monthSep 26, 2025 |
| [convert\_hf\_to\_gguf.py](https://github.com/ggml-org/llama.cpp/blob/master/convert_hf_to_gguf.py "convert_hf_to_gguf.py") | [convert\_hf\_to\_gguf.py](https://github.com/ggml-org/llama.cpp/blob/master/convert_hf_to_gguf.py "convert_hf_to_gguf.py") | [model : add LightOnOCR-1B model (](https://github.com/ggml-org/llama.cpp/commit/c55d53acec864f64afa1ba92972203dce1bf88f5 "model : add LightOnOCR-1B model (#16764)  * model : add LightOnOCR-1B model  * add test") [#16764](https://github.com/ggml-org/llama.cpp/pull/16764) [)](https://github.com/ggml-org/llama.cpp/commit/c55d53acec864f64afa1ba92972203dce1bf88f5 "model : add LightOnOCR-1B model (#16764)  * model : add LightOnOCR-1B model  * add test") | 6 hours agoOct 27, 2025 |
| [convert\_hf\_to\_gguf\_update.py](https://github.com/ggml-org/llama.cpp/blob/master/convert_hf_to_gguf_update.py "convert_hf_to_gguf_update.py") | [convert\_hf\_to\_gguf\_update.py](https://github.com/ggml-org/llama.cpp/blob/master/convert_hf_to_gguf_update.py "convert_hf_to_gguf_update.py") | [model : add BailingMoeV2 support (](https://github.com/ggml-org/llama.cpp/commit/84bf3c677857279037adf67cdcfd89eaa4ca9281 "model : add BailingMoeV2 support (#16063)  * add BailingMoeV2 support  * update llm types  * undo  * undo  * update llm types  * add model collection link  * update  * almost working  * correct group selection and rename n_group_exp  * avoid large top_k and use argmax instead for now  if we had something like argmax2 that would be equivalent, but this works fine until then  * poke  * skip group selection when there are no tokens  * fix 1T conversion  * hopefully fixed expert group selection  third time's the charm?  * make expert group selection generally available  The new LLaDA2Moe model uses this method too, make it generally available regardless of architecture.  * allow n_expert_groups to be 1 (Kimi K2)  * address review suggestions") [#16063](https://github.com/ggml-org/llama.cpp/pull/16063) [)](https://github.com/ggml-org/llama.cpp/commit/84bf3c677857279037adf67cdcfd89eaa4ca9281 "model : add BailingMoeV2 support (#16063)  * add BailingMoeV2 support  * update llm types  * undo  * undo  * update llm types  * add model collection link  * update  * almost working  * correct group selection and rename n_group_exp  * avoid large top_k and use argmax instead for now  if we had something like argmax2 that would be equivalent, but this works fine until then  * poke  * skip group selection when there are no tokens  * fix 1T conversion  * hopefully fixed expert group selection  third time's the charm?  * make expert group selection generally available  The new LLaDA2Moe model uses this method too, make it generally available regardless of architecture.  * allow n_expert_groups to be 1 (Kimi K2)  * address review suggestions") | last weekOct 20, 2025 |
| [convert\_llama\_ggml\_to\_gguf.py](https://github.com/ggml-org/llama.cpp/blob/master/convert_llama_ggml_to_gguf.py "convert_llama_ggml_to_gguf.py") | [convert\_llama\_ggml\_to\_gguf.py](https://github.com/ggml-org/llama.cpp/blob/master/convert_llama_ggml_to_gguf.py "convert_llama_ggml_to_gguf.py") | [py : fix wrong input type for raw\_dtype in ggml to gguf scripts (](https://github.com/ggml-org/llama.cpp/commit/ee2984bdaf10c14d440ad873a049bcc09b786d9b "py : fix wrong input type for raw_dtype in ggml to gguf scripts (#8928)  Co-authored-by: farbod <farbod.bjary82@gmail.com>") [#8928](https://github.com/ggml-org/llama.cpp/pull/8928) [)](https://github.com/ggml-org/llama.cpp/commit/ee2984bdaf10c14d440ad873a049bcc09b786d9b "py : fix wrong input type for raw_dtype in ggml to gguf scripts (#8928)  Co-authored-by: farbod <farbod.bjary82@gmail.com>") | last yearAug 16, 2024 |
| [convert\_lora\_to\_gguf.py](https://github.com/ggml-org/llama.cpp/blob/master/convert_lora_to_gguf.py "convert_lora_to_gguf.py") | [convert\_lora\_to\_gguf.py](https://github.com/ggml-org/llama.cpp/blob/master/convert_lora_to_gguf.py "convert_lora_to_gguf.py") | [aLoRA Support (](https://github.com/ggml-org/llama.cpp/commit/fd621880f3fd908424e675a41715a2dc760247a2 "aLoRA Support (#15327)  * feat: Add python-side constants and conversion for adapter.lora.invocation_string  Branch: gabe-l-hart/alora-support  Signed-off-by: Gabe Goodhart <ghart@us.ibm.com>  * feat: Add c++ side constants for adapter.lora.invocation_string  Branch: gabe-l-hart/alora-support  Signed-off-by: Gabe Goodhart <ghart@us.ibm.com>  * feat: Parse invocation string for adapters from GGUF  Branch: gabe-l-hart/alora-support  Signed-off-by: Gabe Goodhart <ghart@us.ibm.com>  * fix(python): Update conversion to alora_invocation_tokens  This is the preferred method in PEFT which is the source of ground truth  https://github.com/huggingface/peft/pull/2609/files#diff-13380145401d203d5935c5189dd09879f990b81aa63e8e3aaff8ce9110333f0e  Branch: gabe-l-hart/alora-support  Signed-off-by: Gabe Goodhart <ghart@us.ibm.com>  * fix(cpp): Update to alora_invocation_tokens on c++ side  Branch: gabe-l-hart/alora-support  Signed-off-by: Gabe Goodhart <ghart@us.ibm.com>  * feat: Add C APIs to get alora invocation token array from lora  Branch: gabe-l-hart/alora-support  Signed-off-by: Gabe Goodhart <ghart@us.ibm.com>  * feat: Initial implementation of alora cache logic in server  This does not yet do the part to identify the invocation tokens and only apply the lora adapter afterwards, but it does seem to produce correct results if the invocation tokens are the beginning of the uncached input.  Branch: gabe-l-hart/alora-support  Signed-off-by: Gabe Goodhart <ghart@us.ibm.com>  * feat: Identify alora invocation sequences  This currently limits to a single enabled alora per slot. Multiple aloras with different invocation sequences would be possible, but it would require a more complex integration of the adapter toggling and is not really a well studied case for alora since it's unclear if one alora can reuse cache from previous prefill computed with a different alora.  Branch: gabe-l-hart/alora-support  Signed-off-by: Gabe Goodhart <ghart@us.ibm.com>  * feat: Only reuse cache for tokens before the alora invocation start  This is a bit of an edge case, but theoretically a user could try the same query with the alora disabled (just using the base model), then retry with the alora. The cached tokens from the first pass should be invalid.  Branch: gabe-l-hart/alora-support  Signed-off-by: Gabe Goodhart <ghart@us.ibm.com>  * feat: Handle un-cached tokens that come before the alora activation  The solution is to only fill up to the token before the invocation start in the batch if there are any tokens to be prefilled between those pulled from cache and the invocation start. When this is detected, the alora is temporarily disabled with a scale of 0.0, then immediately re-enabled after it has been initialized for the internal graph. Since the batch does not complete the prompt tokens, the remaining prompt tokens are handled in the next task, pulling all of the non-alora tokens from cache and proceeding with prefill for the alora tokens.  Branch: gabe-l-hart/alora-support  Signed-off-by: Gabe Goodhart <ghart@us.ibm.com>  * fix: Use || instead of 'or'  Too much python :facepalm:  Branch: gabe-l-hart/alora-support  Signed-off-by: Gabe Goodhart <ghart@us.ibm.com>  * fix: Fix off-by-one for limiting cached tokens to before alora start  This was the cause of the inconsistent results from the dummy test script with and without the turn that runs the prompt without the adapter before running it with the adapter.  Branch: gabe-l-hart/alora-support  Signed-off-by: Gabe Goodhart <ghart@us.ibm.com>  * fix: Support backwards-compatibility for \"invocation_string\" in adapter_config.json  While this has been replaced in the PEFT PR in favor of alora_invocation_tokens, the existing adapters in the ibm-granite org on HF use \"invocation_string,\" so this will enable backwards compatibility and enable testing now (before PEFT PR changes have percolated everywhere).  Branch: gabe-l-hart/alora-support  Signed-off-by: Gabe Goodhart <ghart@us.ibm.com>  * fix: Remove duplicate logging  Signed-off-by: Gabe Goodhart <ghart@us.ibm.com>  Co-authored-by: Sigbjørn Skjæret <sigbjorn.skjaeret@scala.com>  * feat: Report alora_invocation_string and alora_invocation_tokens from /lora-adapters  Branch: gabe-l-hart/alora-support  Signed-off-by: Gabe Goodhart <ghart@us.ibm.com>  ---------  Signed-off-by: Gabe Goodhart <ghart@us.ibm.com> Co-authored-by: Sigbjørn Skjæret <sigbjorn.skjaeret@scala.com>") [#15327](https://github.com/ggml-org/llama.cpp/pull/15327) [)](https://github.com/ggml-org/llama.cpp/commit/fd621880f3fd908424e675a41715a2dc760247a2 "aLoRA Support (#15327)  * feat: Add python-side constants and conversion for adapter.lora.invocation_string  Branch: gabe-l-hart/alora-support  Signed-off-by: Gabe Goodhart <ghart@us.ibm.com>  * feat: Add c++ side constants for adapter.lora.invocation_string  Branch: gabe-l-hart/alora-support  Signed-off-by: Gabe Goodhart <ghart@us.ibm.com>  * feat: Parse invocation string for adapters from GGUF  Branch: gabe-l-hart/alora-support  Signed-off-by: Gabe Goodhart <ghart@us.ibm.com>  * fix(python): Update conversion to alora_invocation_tokens  This is the preferred method in PEFT which is the source of ground truth  https://github.com/huggingface/peft/pull/2609/files#diff-13380145401d203d5935c5189dd09879f990b81aa63e8e3aaff8ce9110333f0e  Branch: gabe-l-hart/alora-support  Signed-off-by: Gabe Goodhart <ghart@us.ibm.com>  * fix(cpp): Update to alora_invocation_tokens on c++ side  Branch: gabe-l-hart/alora-support  Signed-off-by: Gabe Goodhart <ghart@us.ibm.com>  * feat: Add C APIs to get alora invocation token array from lora  Branch: gabe-l-hart/alora-support  Signed-off-by: Gabe Goodhart <ghart@us.ibm.com>  * feat: Initial implementation of alora cache logic in server  This does not yet do the part to identify the invocation tokens and only apply the lora adapter afterwards, but it does seem to produce correct results if the invocation tokens are the beginning of the uncached input.  Branch: gabe-l-hart/alora-support  Signed-off-by: Gabe Goodhart <ghart@us.ibm.com>  * feat: Identify alora invocation sequences  This currently limits to a single enabled alora per slot. Multiple aloras with different invocation sequences would be possible, but it would require a more complex integration of the adapter toggling and is not really a well studied case for alora since it's unclear if one alora can reuse cache from previous prefill computed with a different alora.  Branch: gabe-l-hart/alora-support  Signed-off-by: Gabe Goodhart <ghart@us.ibm.com>  * feat: Only reuse cache for tokens before the alora invocation start  This is a bit of an edge case, but theoretically a user could try the same query with the alora disabled (just using the base model), then retry with the alora. The cached tokens from the first pass should be invalid.  Branch: gabe-l-hart/alora-support  Signed-off-by: Gabe Goodhart <ghart@us.ibm.com>  * feat: Handle un-cached tokens that come before the alora activation  The solution is to only fill up to the token before the invocation start in the batch if there are any tokens to be prefilled between those pulled from cache and the invocation start. When this is detected, the alora is temporarily disabled with a scale of 0.0, then immediately re-enabled after it has been initialized for the internal graph. Since the batch does not complete the prompt tokens, the remaining prompt tokens are handled in the next task, pulling all of the non-alora tokens from cache and proceeding with prefill for the alora tokens.  Branch: gabe-l-hart/alora-support  Signed-off-by: Gabe Goodhart <ghart@us.ibm.com>  * fix: Use || instead of 'or'  Too much python :facepalm:  Branch: gabe-l-hart/alora-support  Signed-off-by: Gabe Goodhart <ghart@us.ibm.com>  * fix: Fix off-by-one for limiting cached tokens to before alora start  This was the cause of the inconsistent results from the dummy test script with and without the turn that runs the prompt without the adapter before running it with the adapter.  Branch: gabe-l-hart/alora-support  Signed-off-by: Gabe Goodhart <ghart@us.ibm.com>  * fix: Support backwards-compatibility for \"invocation_string\" in adapter_config.json  While this has been replaced in the PEFT PR in favor of alora_invocation_tokens, the existing adapters in the ibm-granite org on HF use \"invocation_string,\" so this will enable backwards compatibility and enable testing now (before PEFT PR changes have percolated everywhere).  Branch: gabe-l-hart/alora-support  Signed-off-by: Gabe Goodhart <ghart@us.ibm.com>  * fix: Remove duplicate logging  Signed-off-by: Gabe Goodhart <ghart@us.ibm.com>  Co-authored-by: Sigbjørn Skjæret <sigbjorn.skjaeret@scala.com>  * feat: Report alora_invocation_string and alora_invocation_tokens from /lora-adapters  Branch: gabe-l-hart/alora-support  Signed-off-by: Gabe Goodhart <ghart@us.ibm.com>  ---------  Signed-off-by: Gabe Goodhart <ghart@us.ibm.com> Co-authored-by: Sigbjørn Skjæret <sigbjorn.skjaeret@scala.com>") | last monthSep 5, 2025 |
| [flake.lock](https://github.com/ggml-org/llama.cpp/blob/master/flake.lock "flake.lock") | [flake.lock](https://github.com/ggml-org/llama.cpp/blob/master/flake.lock "flake.lock") | [flake.lock: Update (](https://github.com/ggml-org/llama.cpp/commit/cce5a9007572c6e9fa522296b77571d2e5071357 "flake.lock: Update (#10470)  Flake lock file updates:  • Updated input 'nixpkgs':     'github:NixOS/nixpkgs/5e4fbfb6b3de1aa2872b76d49fafc942626e2add?narHash=sha256-OZiZ3m8SCMfh3B6bfGC/Bm4x3qc1m2SVEAlkV6iY7Yg%3D' (2024-11-15)   → 'github:NixOS/nixpkgs/23e89b7da85c3640bbc2173fe04f4bd114342367?narHash=sha256-y/MEyuJ5oBWrWAic/14LaIr/u5E0wRVzyYsouYY3W6w%3D' (2024-11-19)  Co-authored-by: github-actions[bot] <github-actions[bot]@users.noreply.github.com>") [#10470](https://github.com/ggml-org/llama.cpp/pull/10470) [)](https://github.com/ggml-org/llama.cpp/commit/cce5a9007572c6e9fa522296b77571d2e5071357 "flake.lock: Update (#10470)  Flake lock file updates:  • Updated input 'nixpkgs':     'github:NixOS/nixpkgs/5e4fbfb6b3de1aa2872b76d49fafc942626e2add?narHash=sha256-OZiZ3m8SCMfh3B6bfGC/Bm4x3qc1m2SVEAlkV6iY7Yg%3D' (2024-11-15)   → 'github:NixOS/nixpkgs/23e89b7da85c3640bbc2173fe04f4bd114342367?narHash=sha256-y/MEyuJ5oBWrWAic/14LaIr/u5E0wRVzyYsouYY3W6w%3D' (2024-11-19)  Co-authored-by: github-actions[bot] <github-actions[bot]@users.noreply.github.com>") | 11 months agoNov 24, 2024 |
| [flake.nix](https://github.com/ggml-org/llama.cpp/blob/master/flake.nix "flake.nix") | [flake.nix](https://github.com/ggml-org/llama.cpp/blob/master/flake.nix "flake.nix") | [fix(nix): remove non-functional llama-cpp cachix cache from flake.nix (](https://github.com/ggml-org/llama.cpp/commit/1adc9812bd33dc85489bf093528d61c22917d54f "fix(nix): remove non-functional llama-cpp cachix cache from flake.nix (#15295)  The flake.nix included references to llama-cpp.cachix.org cache with a comment claiming it's 'Populated by the CI in ggml-org/llama.cpp', but:  1. No visible CI workflow populates this cache 2. The cache is empty for recent builds (tested b6150, etc.) 3. This misleads users into expecting pre-built binaries that don't exist  This change removes the non-functional cache references entirely, leaving only the working cuda-maintainers cache that actually provides CUDA dependencies.  Users can still manually add the llama-cpp cache if it becomes functional in the future.") […](https://github.com/ggml-org/llama.cpp/pull/15295) | 2 months agoAug 13, 2025 |
| [mypy.ini](https://github.com/ggml-org/llama.cpp/blob/master/mypy.ini "mypy.ini") | [mypy.ini](https://github.com/ggml-org/llama.cpp/blob/master/mypy.ini "mypy.ini") | [convert : partially revert PR](https://github.com/ggml-org/llama.cpp/commit/b43ebde3b0ccbc42d9dd782b32e2fd8eb35b43b5 "convert : partially revert PR #4818 (#5041)") [#4818](https://github.com/ggml-org/llama.cpp/pull/4818) [(](https://github.com/ggml-org/llama.cpp/commit/b43ebde3b0ccbc42d9dd782b32e2fd8eb35b43b5 "convert : partially revert PR #4818 (#5041)") [#5041](https://github.com/ggml-org/llama.cpp/pull/5041) [)](https://github.com/ggml-org/llama.cpp/commit/b43ebde3b0ccbc42d9dd782b32e2fd8eb35b43b5 "convert : partially revert PR #4818 (#5041)") | last yearJan 20, 2024 |
| [poetry.lock](https://github.com/ggml-org/llama.cpp/blob/master/poetry.lock "poetry.lock") | [poetry.lock](https://github.com/ggml-org/llama.cpp/blob/master/poetry.lock "poetry.lock") | [build(python): Package scripts with pip-0517 compliance](https://github.com/ggml-org/llama.cpp/commit/b0a46993dfbf8b8127598f319d4dcfdd83824ba8 "build(python): Package scripts with pip-0517 compliance") | last yearJul 4, 2024 |
| [pyproject.toml](https://github.com/ggml-org/llama.cpp/blob/master/pyproject.toml "pyproject.toml") | [pyproject.toml](https://github.com/ggml-org/llama.cpp/blob/master/pyproject.toml "pyproject.toml") | [gguf-py : avoid requiring pyside6 for other scripts (](https://github.com/ggml-org/llama.cpp/commit/a7366faa5bb2fff97b9fb43340d853709f52d8c9 "gguf-py : avoid requiring pyside6 for other scripts (#13036)  - gguf-py : remove gguf-py/gguf/scripts/__init__.py because it's not needed  Implicit namespaces are supported since Python 3.3 (https://peps.python.org/pep-0420/), and the entrypoints in pyproject.toml can directly refer to the main functions.") [#13036](https://github.com/ggml-org/llama.cpp/pull/13036) [)](https://github.com/ggml-org/llama.cpp/commit/a7366faa5bb2fff97b9fb43340d853709f52d8c9 "gguf-py : avoid requiring pyside6 for other scripts (#13036)  - gguf-py : remove gguf-py/gguf/scripts/__init__.py because it's not needed  Implicit namespaces are supported since Python 3.3 (https://peps.python.org/pep-0420/), and the entrypoints in pyproject.toml can directly refer to the main functions.") | 5 months agoMay 5, 2025 |
| [pyrightconfig.json](https://github.com/ggml-org/llama.cpp/blob/master/pyrightconfig.json "pyrightconfig.json") | [pyrightconfig.json](https://github.com/ggml-org/llama.cpp/blob/master/pyrightconfig.json "pyrightconfig.json") | [llama : move end-user examples to tools directory (](https://github.com/ggml-org/llama.cpp/commit/1d36b3670b285e69e58b9d687c770a2a0a192194 "llama : move end-user examples to tools directory (#13249)  * llama : move end-user examples to tools directory  ---------  Co-authored-by: Xuan Son Nguyen <son@huggingface.co>") [#13249](https://github.com/ggml-org/llama.cpp/pull/13249) [)](https://github.com/ggml-org/llama.cpp/commit/1d36b3670b285e69e58b9d687c770a2a0a192194 "llama : move end-user examples to tools directory (#13249)  * llama : move end-user examples to tools directory  ---------  Co-authored-by: Xuan Son Nguyen <son@huggingface.co>") | 6 months agoMay 2, 2025 |
| [requirements.txt](https://github.com/ggml-org/llama.cpp/blob/master/requirements.txt "requirements.txt") | [requirements.txt](https://github.com/ggml-org/llama.cpp/blob/master/requirements.txt "requirements.txt") | [`tool-call`: fix Qwen 2.5 Coder support, add micro benchmarks, suppor…](https://github.com/ggml-org/llama.cpp/commit/669912d9a5bf927312c553332ff997f0a99da8fb "`tool-call`: fix Qwen 2.5 Coder support, add micro benchmarks, support trigger patterns for lazy grammars (#12034)  * sampler: turn lazy grammar trigger words to regexes  * add scripts/tool_bench.sh & .py  * constrain llama json output regardless of function name if matches at beginning  * update relaxed newline space rule in grammar tests  * support add_generation_prompt query parameter (useful for /apply_template)  * Update src/llama-grammar.cpp  Co-authored-by: Georgi Gerganov <ggerganov@gmail.com>  ---------  Co-authored-by: Georgi Gerganov <ggerganov@gmail.com>") | 7 months agoMar 5, 2025 |
| View all files |

## Repository files navigation

# llama.cpp

[Permalink: llama.cpp](https://github.com/ggml-org/llama.cpp#llamacpp)

[![llama](https://user-images.githubusercontent.com/1991296/230134379-7181e485-c521-4d23-a0d6-f7b3b61ba524.png)](https://user-images.githubusercontent.com/1991296/230134379-7181e485-c521-4d23-a0d6-f7b3b61ba524.png)

[![License: MIT](https://camo.githubusercontent.com/6581c31c16c1b13ddc2efb92e2ad69a93ddc4a92fd871ff15d401c4c6c9155a4/68747470733a2f2f696d672e736869656c64732e696f2f62616467652f6c6963656e73652d4d49542d626c75652e737667)](https://opensource.org/licenses/MIT)[![Release](https://camo.githubusercontent.com/3147b147536e3e2a6759fa8b378ff245e4f4724e7904a946d3acbe5b2c535c19/68747470733a2f2f696d672e736869656c64732e696f2f6769746875622f762f72656c656173652f67676d6c2d6f72672f6c6c616d612e637070)](https://github.com/ggml-org/llama.cpp/releases)[![Server](https://github.com/ggml-org/llama.cpp/actions/workflows/server.yml/badge.svg)](https://github.com/ggml-org/llama.cpp/actions/workflows/server.yml)

[Manifesto](https://github.com/ggml-org/llama.cpp/discussions/205) / [ggml](https://github.com/ggml-org/ggml) / [ops](https://github.com/ggml-org/llama.cpp/blob/master/docs/ops.md)

LLM inference in C/C++

## Recent API changes

[Permalink: Recent API changes](https://github.com/ggml-org/llama.cpp#recent-api-changes)

- [Changelog for `libllama` API](https://github.com/ggml-org/llama.cpp/issues/9289)
- [Changelog for `llama-server` REST API](https://github.com/ggml-org/llama.cpp/issues/9291)

## Hot topics

[Permalink: Hot topics](https://github.com/ggml-org/llama.cpp#hot-topics)

- **[guide : running gpt-oss with llama.cpp](https://github.com/ggml-org/llama.cpp/discussions/15396)**
- **[\[FEEDBACK\] Better packaging for llama.cpp to support downstream consumers 🤗](https://github.com/ggml-org/llama.cpp/discussions/15313)**
- Support for the `gpt-oss` model with native MXFP4 format has been added \| [PR](https://github.com/ggml-org/llama.cpp/pull/15091) \| [Collaboration with NVIDIA](https://blogs.nvidia.com/blog/rtx-ai-garage-openai-oss) \| [Comment](https://github.com/ggml-org/llama.cpp/discussions/15095)
- Hot PRs: [All](https://github.com/ggml-org/llama.cpp/pulls?q=is%3Apr+label%3Ahot+) \| [Open](https://github.com/ggml-org/llama.cpp/pulls?q=is%3Apr+label%3Ahot+is%3Aopen)
- Multimodal support arrived in `llama-server`: [#12898](https://github.com/ggml-org/llama.cpp/pull/12898) \| [documentation](https://github.com/ggml-org/llama.cpp/blob/master/docs/multimodal.md)
- VS Code extension for FIM completions: [https://github.com/ggml-org/llama.vscode](https://github.com/ggml-org/llama.vscode)
- Vim/Neovim plugin for FIM completions: [https://github.com/ggml-org/llama.vim](https://github.com/ggml-org/llama.vim)
- Introducing GGUF-my-LoRA [#10123](https://github.com/ggml-org/llama.cpp/discussions/10123)
- Hugging Face Inference Endpoints now support GGUF out of the box! [#9669](https://github.com/ggml-org/llama.cpp/discussions/9669)
- Hugging Face GGUF editor: [discussion](https://github.com/ggml-org/llama.cpp/discussions/9268) \| [tool](https://huggingface.co/spaces/CISCai/gguf-editor)

* * *

## Quick start

[Permalink: Quick start](https://github.com/ggml-org/llama.cpp#quick-start)

Getting started with llama.cpp is straightforward. Here are several ways to install it on your machine:

- Install `llama.cpp` using [brew, nix or winget](https://github.com/ggml-org/llama.cpp/blob/master/docs/install.md)
- Run with Docker - see our [Docker documentation](https://github.com/ggml-org/llama.cpp/blob/master/docs/docker.md)
- Download pre-built binaries from the [releases page](https://github.com/ggml-org/llama.cpp/releases)
- Build from source by cloning this repository - check out [our build guide](https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md)

Once installed, you'll need a model to work with. Head to the [Obtaining and quantizing models](https://github.com/ggml-org/llama.cpp#obtaining-and-quantizing-models) section to learn more.

Example command:

```
# Use a local model file
llama-cli -m my_model.gguf

# Or download and run a model directly from Hugging Face
llama-cli -hf ggml-org/gemma-3-1b-it-GGUF

# Launch OpenAI-compatible API server
llama-server -hf ggml-org/gemma-3-1b-it-GGUF
```

## Description

[Permalink: Description](https://github.com/ggml-org/llama.cpp#description)

The main goal of `llama.cpp` is to enable LLM inference with minimal setup and state-of-the-art performance on a wide
range of hardware - locally and in the cloud.

- Plain C/C++ implementation without any dependencies
- Apple silicon is a first-class citizen - optimized via ARM NEON, Accelerate and Metal frameworks
- AVX, AVX2, AVX512 and AMX support for x86 architectures
- 1.5-bit, 2-bit, 3-bit, 4-bit, 5-bit, 6-bit, and 8-bit integer quantization for faster inference and reduced memory use
- Custom CUDA kernels for running LLMs on NVIDIA GPUs (support for AMD GPUs via HIP and Moore Threads GPUs via MUSA)
- Vulkan and SYCL backend support
- CPU+GPU hybrid inference to partially accelerate models larger than the total VRAM capacity

The `llama.cpp` project is the main playground for developing new features for the [ggml](https://github.com/ggml-org/ggml) library.

Models

Typically finetunes of the base models below are supported as well.

Instructions for adding support for new models: [HOWTO-add-model.md](https://github.com/ggml-org/llama.cpp/blob/master/docs/development/HOWTO-add-model.md)

#### Text-only

[Permalink: Text-only](https://github.com/ggml-org/llama.cpp#text-only)

- [x]  LLaMA 🦙
- [x]  LLaMA 2 🦙🦙
- [x]  LLaMA 3 🦙🦙🦙
- [x] [Mistral 7B](https://huggingface.co/mistralai/Mistral-7B-v0.1)
- [x] [Mixtral MoE](https://huggingface.co/models?search=mistral-ai/Mixtral)
- [x] [DBRX](https://huggingface.co/databricks/dbrx-instruct)
- [x] [Jamba](https://huggingface.co/ai21labs)
- [x] [Falcon](https://huggingface.co/models?search=tiiuae/falcon)
- [x] [Chinese LLaMA / Alpaca](https://github.com/ymcui/Chinese-LLaMA-Alpaca) and [Chinese LLaMA-2 / Alpaca-2](https://github.com/ymcui/Chinese-LLaMA-Alpaca-2)
- [x] [Vigogne (French)](https://github.com/bofenghuang/vigogne)
- [x] [BERT](https://github.com/ggml-org/llama.cpp/pull/5423)
- [x] [Koala](https://bair.berkeley.edu/blog/2023/04/03/koala/)
- [x] [Baichuan 1 & 2](https://huggingface.co/models?search=baichuan-inc/Baichuan) \+ [derivations](https://huggingface.co/hiyouga/baichuan-7b-sft)
- [x] [Aquila 1 & 2](https://huggingface.co/models?search=BAAI/Aquila)
- [x] [Starcoder models](https://github.com/ggml-org/llama.cpp/pull/3187)
- [x] [Refact](https://huggingface.co/smallcloudai/Refact-1_6B-fim)
- [x] [MPT](https://github.com/ggml-org/llama.cpp/pull/3417)
- [x] [Bloom](https://github.com/ggml-org/llama.cpp/pull/3553)
- [x] [Yi models](https://huggingface.co/models?search=01-ai/Yi)
- [x] [StableLM models](https://huggingface.co/stabilityai)
- [x] [Deepseek models](https://huggingface.co/models?search=deepseek-ai/deepseek)
- [x] [Qwen models](https://huggingface.co/models?search=Qwen/Qwen)
- [x] [PLaMo-13B](https://github.com/ggml-org/llama.cpp/pull/3557)
- [x] [Phi models](https://huggingface.co/models?search=microsoft/phi)
- [x] [PhiMoE](https://github.com/ggml-org/llama.cpp/pull/11003)
- [x] [GPT-2](https://huggingface.co/gpt2)
- [x] [Orion 14B](https://github.com/ggml-org/llama.cpp/pull/5118)
- [x] [InternLM2](https://huggingface.co/models?search=internlm2)
- [x] [CodeShell](https://github.com/WisdomShell/codeshell)
- [x] [Gemma](https://ai.google.dev/gemma)
- [x] [Mamba](https://github.com/state-spaces/mamba)
- [x] [Grok-1](https://huggingface.co/keyfan/grok-1-hf)
- [x] [Xverse](https://huggingface.co/models?search=xverse)
- [x] [Command-R models](https://huggingface.co/models?search=CohereForAI/c4ai-command-r)
- [x] [SEA-LION](https://huggingface.co/models?search=sea-lion)
- [x] [GritLM-7B](https://huggingface.co/GritLM/GritLM-7B) \+ [GritLM-8x7B](https://huggingface.co/GritLM/GritLM-8x7B)
- [x] [OLMo](https://allenai.org/olmo)
- [x] [OLMo 2](https://allenai.org/olmo)
- [x] [OLMoE](https://huggingface.co/allenai/OLMoE-1B-7B-0924)
- [x] [Granite models](https://huggingface.co/collections/ibm-granite/granite-code-models-6624c5cec322e4c148c8b330)
- [x] [GPT-NeoX](https://github.com/EleutherAI/gpt-neox) \+ [Pythia](https://github.com/EleutherAI/pythia)
- [x] [Snowflake-Arctic MoE](https://huggingface.co/collections/Snowflake/arctic-66290090abe542894a5ac520)
- [x] [Smaug](https://huggingface.co/models?search=Smaug)
- [x] [Poro 34B](https://huggingface.co/LumiOpen/Poro-34B)
- [x] [Bitnet b1.58 models](https://huggingface.co/1bitLLM)
- [x] [Flan T5](https://huggingface.co/models?search=flan-t5)
- [x] [Open Elm models](https://huggingface.co/collections/apple/openelm-instruct-models-6619ad295d7ae9f868b759ca)
- [x] [ChatGLM3-6b](https://huggingface.co/THUDM/chatglm3-6b) \+ [ChatGLM4-9b](https://huggingface.co/THUDM/glm-4-9b) \+ [GLMEdge-1.5b](https://huggingface.co/THUDM/glm-edge-1.5b-chat) \+ [GLMEdge-4b](https://huggingface.co/THUDM/glm-edge-4b-chat)
- [x] [GLM-4-0414](https://huggingface.co/collections/THUDM/glm-4-0414-67f3cbcb34dd9d252707cb2e)
- [x] [SmolLM](https://huggingface.co/collections/HuggingFaceTB/smollm-6695016cad7167254ce15966)
- [x] [EXAONE-3.0-7.8B-Instruct](https://huggingface.co/LGAI-EXAONE/EXAONE-3.0-7.8B-Instruct)
- [x] [FalconMamba Models](https://huggingface.co/collections/tiiuae/falconmamba-7b-66b9a580324dd1598b0f6d4a)
- [x] [Jais](https://huggingface.co/inceptionai/jais-13b-chat)
- [x] [Bielik-11B-v2.3](https://huggingface.co/collections/speakleash/bielik-11b-v23-66ee813238d9b526a072408a)
- [x] [RWKV-6](https://github.com/BlinkDL/RWKV-LM)
- [x] [QRWKV-6](https://huggingface.co/recursal/QRWKV6-32B-Instruct-Preview-v0.1)
- [x] [GigaChat-20B-A3B](https://huggingface.co/ai-sage/GigaChat-20B-A3B-instruct)
- [x] [Trillion-7B-preview](https://huggingface.co/trillionlabs/Trillion-7B-preview)
- [x] [Ling models](https://huggingface.co/collections/inclusionAI/ling-67c51c85b34a7ea0aba94c32)
- [x] [LFM2 models](https://huggingface.co/collections/LiquidAI/lfm2-686d721927015b2ad73eaa38)
- [x] [Hunyuan models](https://huggingface.co/collections/tencent/hunyuan-dense-model-6890632cda26b19119c9c5e7)
- [x] [BailingMoeV2 (Ring/Ling 2.0) models](https://huggingface.co/collections/inclusionAI/ling-v2-68bf1dd2fc34c306c1fa6f86)

#### Multimodal

[Permalink: Multimodal](https://github.com/ggml-org/llama.cpp#multimodal)

- [x] [LLaVA 1.5 models](https://huggingface.co/collections/liuhaotian/llava-15-653aac15d994e992e2677a7e), [LLaVA 1.6 models](https://huggingface.co/collections/liuhaotian/llava-16-65b9e40155f60fd046a5ccf2)
- [x] [BakLLaVA](https://huggingface.co/models?search=SkunkworksAI/Bakllava)
- [x] [Obsidian](https://huggingface.co/NousResearch/Obsidian-3B-V0.5)
- [x] [ShareGPT4V](https://huggingface.co/models?search=Lin-Chen/ShareGPT4V)
- [x] [MobileVLM 1.7B/3B models](https://huggingface.co/models?search=mobileVLM)
- [x] [Yi-VL](https://huggingface.co/models?search=Yi-VL)
- [x] [Mini CPM](https://huggingface.co/models?search=MiniCPM)
- [x] [Moondream](https://huggingface.co/vikhyatk/moondream2)
- [x] [Bunny](https://github.com/BAAI-DCAI/Bunny)
- [x] [GLM-EDGE](https://huggingface.co/models?search=glm-edge)
- [x] [Qwen2-VL](https://huggingface.co/collections/Qwen/qwen2-vl-66cee7455501d7126940800d)
- [x] [LFM2-VL](https://huggingface.co/collections/LiquidAI/lfm2-vl-68963bbc84a610f7638d5ffa)

Bindings

- Python: [ddh0/easy-llama](https://github.com/ddh0/easy-llama)
- Python: [abetlen/llama-cpp-python](https://github.com/abetlen/llama-cpp-python)
- Go: [go-skynet/go-llama.cpp](https://github.com/go-skynet/go-llama.cpp)
- Node.js: [withcatai/node-llama-cpp](https://github.com/withcatai/node-llama-cpp)
- JS/TS (llama.cpp server client): [lgrammel/modelfusion](https://modelfusion.dev/integration/model-provider/llamacpp)
- JS/TS (Programmable Prompt Engine CLI): [offline-ai/cli](https://github.com/offline-ai/cli)
- JavaScript/Wasm (works in browser): [tangledgroup/llama-cpp-wasm](https://github.com/tangledgroup/llama-cpp-wasm)
- Typescript/Wasm (nicer API, available on npm): [ngxson/wllama](https://github.com/ngxson/wllama)
- Ruby: [yoshoku/llama\_cpp.rb](https://github.com/yoshoku/llama_cpp.rb)
- Rust (more features): [edgenai/llama\_cpp-rs](https://github.com/edgenai/llama_cpp-rs)
- Rust (nicer API): [mdrokz/rust-llama.cpp](https://github.com/mdrokz/rust-llama.cpp)
- Rust (more direct bindings): [utilityai/llama-cpp-rs](https://github.com/utilityai/llama-cpp-rs)
- Rust (automated build from crates.io): [ShelbyJenkins/llm\_client](https://github.com/ShelbyJenkins/llm_client)
- C#/.NET: [SciSharp/LLamaSharp](https://github.com/SciSharp/LLamaSharp)
- C#/VB.NET (more features - community license): [LM-Kit.NET](https://docs.lm-kit.com/lm-kit-net/index.html)
- Scala 3: [donderom/llm4s](https://github.com/donderom/llm4s)
- Clojure: [phronmophobic/llama.clj](https://github.com/phronmophobic/llama.clj)
- React Native: [mybigday/llama.rn](https://github.com/mybigday/llama.rn)
- Java: [kherud/java-llama.cpp](https://github.com/kherud/java-llama.cpp)
- Java: [QuasarByte/llama-cpp-jna](https://github.com/QuasarByte/llama-cpp-jna)
- Zig: [deins/llama.cpp.zig](https://github.com/Deins/llama.cpp.zig)
- Flutter/Dart: [netdur/llama\_cpp\_dart](https://github.com/netdur/llama_cpp_dart)
- Flutter: [xuegao-tzx/Fllama](https://github.com/xuegao-tzx/Fllama)
- PHP (API bindings and features built on top of llama.cpp): [distantmagic/resonance](https://github.com/distantmagic/resonance) [(more info)](https://github.com/ggml-org/llama.cpp/pull/6326)
- Guile Scheme: [guile\_llama\_cpp](https://savannah.nongnu.org/projects/guile-llama-cpp)
- Swift [srgtuszy/llama-cpp-swift](https://github.com/srgtuszy/llama-cpp-swift)
- Swift [ShenghaiWang/SwiftLlama](https://github.com/ShenghaiWang/SwiftLlama)
- Delphi [Embarcadero/llama-cpp-delphi](https://github.com/Embarcadero/llama-cpp-delphi)
- Go (no CGo needed): [hybridgroup/yzma](https://github.com/hybridgroup/yzma)

UIs

_(to have a project listed here, it should clearly state that it depends on `llama.cpp`)_

- [AI Sublime Text plugin](https://github.com/yaroslavyaroslav/OpenAI-sublime-text) (MIT)
- [cztomsik/ava](https://github.com/cztomsik/ava) (MIT)
- [Dot](https://github.com/alexpinel/Dot) (GPL)
- [eva](https://github.com/ylsdamxssjxxdd/eva) (MIT)
- [iohub/collama](https://github.com/iohub/coLLaMA) (Apache-2.0)
- [janhq/jan](https://github.com/janhq/jan) (AGPL)
- [johnbean393/Sidekick](https://github.com/johnbean393/Sidekick) (MIT)
- [KanTV](https://github.com/zhouwg/kantv?tab=readme-ov-file) (Apache-2.0)
- [KodiBot](https://github.com/firatkiral/kodibot) (GPL)
- [llama.vim](https://github.com/ggml-org/llama.vim) (MIT)
- [LARS](https://github.com/abgulati/LARS) (AGPL)
- [Llama Assistant](https://github.com/vietanhdev/llama-assistant) (GPL)
- [LLMFarm](https://github.com/guinmoon/LLMFarm?tab=readme-ov-file) (MIT)
- [LLMUnity](https://github.com/undreamai/LLMUnity) (MIT)
- [LMStudio](https://lmstudio.ai/) (proprietary)
- [LocalAI](https://github.com/mudler/LocalAI) (MIT)
- [LostRuins/koboldcpp](https://github.com/LostRuins/koboldcpp) (AGPL)
- [MindMac](https://mindmac.app/) (proprietary)
- [MindWorkAI/AI-Studio](https://github.com/MindWorkAI/AI-Studio) (FSL-1.1-MIT)
- [Mobile-Artificial-Intelligence/maid](https://github.com/Mobile-Artificial-Intelligence/maid) (MIT)
- [Mozilla-Ocho/llamafile](https://github.com/Mozilla-Ocho/llamafile) (Apache-2.0)
- [nat/openplayground](https://github.com/nat/openplayground) (MIT)
- [nomic-ai/gpt4all](https://github.com/nomic-ai/gpt4all) (MIT)
- [ollama/ollama](https://github.com/ollama/ollama) (MIT)
- [oobabooga/text-generation-webui](https://github.com/oobabooga/text-generation-webui) (AGPL)
- [PocketPal AI](https://github.com/a-ghorbani/pocketpal-ai) (MIT)
- [psugihara/FreeChat](https://github.com/psugihara/FreeChat) (MIT)
- [ptsochantaris/emeltal](https://github.com/ptsochantaris/emeltal) (MIT)
- [pythops/tenere](https://github.com/pythops/tenere) (AGPL)
- [ramalama](https://github.com/containers/ramalama) (MIT)
- [semperai/amica](https://github.com/semperai/amica) (MIT)
- [withcatai/catai](https://github.com/withcatai/catai) (MIT)
- [Autopen](https://github.com/blackhole89/autopen) (GPL)

Tools

- [akx/ggify](https://github.com/akx/ggify) – download PyTorch models from HuggingFace Hub and convert them to GGML
- [akx/ollama-dl](https://github.com/akx/ollama-dl) – download models from the Ollama library to be used directly with llama.cpp
- [crashr/gppm](https://github.com/crashr/gppm) – launch llama.cpp instances utilizing NVIDIA Tesla P40 or P100 GPUs with reduced idle power consumption
- [gpustack/gguf-parser](https://github.com/gpustack/gguf-parser-go/tree/main/cmd/gguf-parser) \- review/check the GGUF file and estimate the memory usage
- [Styled Lines](https://marketplace.unity.com/packages/tools/generative-ai/styled-lines-llama-cpp-model-292902) (proprietary licensed, async wrapper of inference part for game development in Unity3d with pre-built Mobile and Web platform wrappers and a model example)

Infrastructure

- [Paddler](https://github.com/intentee/paddler) \- Open-source LLMOps platform for hosting and scaling AI in your own infrastructure
- [GPUStack](https://github.com/gpustack/gpustack) \- Manage GPU clusters for running LLMs
- [llama\_cpp\_canister](https://github.com/onicai/llama_cpp_canister) \- llama.cpp as a smart contract on the Internet Computer, using WebAssembly
- [llama-swap](https://github.com/mostlygeek/llama-swap) \- transparent proxy that adds automatic model switching with llama-server
- [Kalavai](https://github.com/kalavai-net/kalavai-client) \- Crowdsource end to end LLM deployment at any scale
- [llmaz](https://github.com/InftyAI/llmaz) \- ☸️ Easy, advanced inference platform for large language models on Kubernetes.

Games

- [Lucy's Labyrinth](https://github.com/MorganRO8/Lucys_Labyrinth) \- A simple maze game where agents controlled by an AI model will try to trick you.

## Supported backends

[Permalink: Supported backends](https://github.com/ggml-org/llama.cpp#supported-backends)

| Backend | Target devices |
| --- | --- |
| [Metal](https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md#metal-build) | Apple Silicon |
| [BLAS](https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md#blas-build) | All |
| [BLIS](https://github.com/ggml-org/llama.cpp/blob/master/docs/backend/BLIS.md) | All |
| [SYCL](https://github.com/ggml-org/llama.cpp/blob/master/docs/backend/SYCL.md) | Intel and Nvidia GPU |
| [MUSA](https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md#musa) | Moore Threads GPU |
| [CUDA](https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md#cuda) | Nvidia GPU |
| [HIP](https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md#hip) | AMD GPU |
| [Vulkan](https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md#vulkan) | GPU |
| [CANN](https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md#cann) | Ascend NPU |
| [OpenCL](https://github.com/ggml-org/llama.cpp/blob/master/docs/backend/OPENCL.md) | Adreno GPU |
| [IBM zDNN](https://github.com/ggml-org/llama.cpp/blob/master/docs/backend/zDNN.md) | IBM Z & LinuxONE |
| [WebGPU \[In Progress\]](https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md#webgpu) | All |
| [RPC](https://github.com/ggml-org/llama.cpp/tree/master/tools/rpc) | All |
| [Hexagon \[In Progress\]](https://github.com/ggml-org/llama.cpp/blob/master/docs/backend/hexagon/README.md) | Snapdragon |

## Obtaining and quantizing models

[Permalink: Obtaining and quantizing models](https://github.com/ggml-org/llama.cpp#obtaining-and-quantizing-models)

The [Hugging Face](https://huggingface.co/) platform hosts a [number of LLMs](https://huggingface.co/models?library=gguf&sort=trending) compatible with `llama.cpp`:

- [Trending](https://huggingface.co/models?library=gguf&sort=trending)
- [LLaMA](https://huggingface.co/models?sort=trending&search=llama+gguf)

You can either manually download the GGUF file or directly use any `llama.cpp`-compatible models from [Hugging Face](https://huggingface.co/) or other model hosting sites, such as [ModelScope](https://modelscope.cn/), by using this CLI argument: `-hf <user>/<model>[:quant]`. For example:

```
llama-cli -hf ggml-org/gemma-3-1b-it-GGUF
```

By default, the CLI would download from Hugging Face, you can switch to other options with the environment variable `MODEL_ENDPOINT`. For example, you may opt to downloading model checkpoints from ModelScope or other model sharing communities by setting the environment variable, e.g. `MODEL_ENDPOINT=https://www.modelscope.cn/`.

After downloading a model, use the CLI tools to run it locally - see below.

`llama.cpp` requires the model to be stored in the [GGUF](https://github.com/ggml-org/ggml/blob/master/docs/gguf.md) file format. Models in other data formats can be converted to GGUF using the `convert_*.py` Python scripts in this repo.

The Hugging Face platform provides a variety of online tools for converting, quantizing and hosting models with `llama.cpp`:

- Use the [GGUF-my-repo space](https://huggingface.co/spaces/ggml-org/gguf-my-repo) to convert to GGUF format and quantize model weights to smaller sizes
- Use the [GGUF-my-LoRA space](https://huggingface.co/spaces/ggml-org/gguf-my-lora) to convert LoRA adapters to GGUF format (more info: [#10123](https://github.com/ggml-org/llama.cpp/discussions/10123))
- Use the [GGUF-editor space](https://huggingface.co/spaces/CISCai/gguf-editor) to edit GGUF meta data in the browser (more info: [#9268](https://github.com/ggml-org/llama.cpp/discussions/9268))
- Use the [Inference Endpoints](https://ui.endpoints.huggingface.co/) to directly host `llama.cpp` in the cloud (more info: [#9669](https://github.com/ggml-org/llama.cpp/discussions/9669))

To learn more about model quantization, [read this documentation](https://github.com/ggml-org/llama.cpp/blob/master/tools/quantize/README.md)

## [`llama-cli`](https://github.com/ggml-org/llama.cpp/blob/master/tools/main)

[Permalink: llama-cli](https://github.com/ggml-org/llama.cpp#llama-cli)

#### A CLI tool for accessing and experimenting with most of `llama.cpp`'s functionality.

[Permalink: A CLI tool for accessing and experimenting with most of llama.cpp's functionality.](https://github.com/ggml-org/llama.cpp#a-cli-tool-for-accessing-and-experimenting-with-most-of-llamacpps-functionality)

- Run in conversation mode

Models with a built-in chat template will automatically activate conversation mode. If this doesn't occur, you can manually enable it by adding `-cnv` and specifying a suitable chat template with `--chat-template NAME`





```
llama-cli -m model.gguf

# > hi, who are you?
# Hi there! I'm your helpful assistant! I'm an AI-powered chatbot designed to assist and provide information to users like you. I'm here to help answer your questions, provide guidance, and offer support on a wide range of topics. I'm a friendly and knowledgeable AI, and I'm always happy to help with anything you need. What's on your mind, and how can I assist you today?
#
# > what is 1+1?
# Easy peasy! The answer to 1+1 is... 2!
```

- Run in conversation mode with custom chat template



```
# use the "chatml" template (use -h to see the list of supported templates)
llama-cli -m model.gguf -cnv --chat-template chatml

# use a custom template
llama-cli -m model.gguf -cnv --in-prefix 'User: ' --reverse-prompt 'User:'
```

- Run simple text completion

To disable conversation mode explicitly, use `-no-cnv`





```
llama-cli -m model.gguf -p "I believe the meaning of life is" -n 128 -no-cnv

# I believe the meaning of life is to find your own truth and to live in accordance with it. For me, this means being true to myself and following my passions, even if they don't align with societal expectations. I think that's what I love about yoga – it's not just a physical practice, but a spiritual one too. It's about connecting with yourself, listening to your inner voice, and honoring your own unique journey.
```

- Constrain the output with a custom grammar



```
llama-cli -m model.gguf -n 256 --grammar-file grammars/json.gbnf -p 'Request: schedule a call at 8pm; Command:'

# {"appointmentTime": "8pm", "appointmentDetails": "schedule a a call"}
```









The [grammars/](https://github.com/ggml-org/llama.cpp/blob/master/grammars) folder contains a handful of sample grammars. To write your own, check out the [GBNF Guide](https://github.com/ggml-org/llama.cpp/blob/master/grammars/README.md).



For authoring more complex JSON grammars, check out [https://grammar.intrinsiclabs.ai/](https://grammar.intrinsiclabs.ai/)


## [`llama-server`](https://github.com/ggml-org/llama.cpp/blob/master/tools/server)

[Permalink: llama-server](https://github.com/ggml-org/llama.cpp#llama-server)

#### A lightweight, [OpenAI API](https://github.com/openai/openai-openapi) compatible, HTTP server for serving LLMs.

[Permalink: A lightweight, OpenAI API compatible, HTTP server for serving LLMs.](https://github.com/ggml-org/llama.cpp#a-lightweight-openai-api-compatible-http-server-for-serving-llms)

- Start a local HTTP server with default configuration on port 8080



```
llama-server -m model.gguf --port 8080

# Basic web UI can be accessed via browser: http://localhost:8080
# Chat completion endpoint: http://localhost:8080/v1/chat/completions
```

- Support multiple-users and parallel decoding



```
# up to 4 concurrent requests, each with 4096 max context
llama-server -m model.gguf -c 16384 -np 4
```

- Enable speculative decoding



```
# the draft.gguf model should be a small variant of the target model.gguf
llama-server -m model.gguf -md draft.gguf
```

- Serve an embedding model



```
# use the /embedding endpoint
llama-server -m model.gguf --embedding --pooling cls -ub 8192
```

- Serve a reranking model



```
# use the /reranking endpoint
llama-server -m model.gguf --reranking
```

- Constrain all outputs with a grammar



```
# custom grammar
llama-server -m model.gguf --grammar-file grammar.gbnf

# JSON
llama-server -m model.gguf --grammar-file grammars/json.gbnf
```


## [`llama-perplexity`](https://github.com/ggml-org/llama.cpp/blob/master/tools/perplexity)

[Permalink: llama-perplexity](https://github.com/ggml-org/llama.cpp#llama-perplexity)

#### A tool for measuring the [perplexity](https://github.com/ggml-org/llama.cpp/blob/master/tools/perplexity/README.md) [1](https://github.com/ggml-org/llama.cpp\#user-content-fn-1-1650c31f15651ba7302c80f83adc18a6) (and other quality metrics) of a model over a given text.

[Permalink: A tool for measuring the perplexity (and other quality metrics) of a model over a given text.](https://github.com/ggml-org/llama.cpp#a-tool-for-measuring-the-perplexity-1-and-other-quality-metrics-of-a-model-over-a-given-text)

- Measure the perplexity over a text file



```
llama-perplexity -m model.gguf -f file.txt

# [1]15.2701,[2]5.4007,[3]5.3073,[4]6.2965,[5]5.8940,[6]5.6096,[7]5.7942,[8]4.9297, ...
# Final estimate: PPL = 5.4007 +/- 0.67339
```

- Measure KL divergence



```
# TODO
```


## [`llama-bench`](https://github.com/ggml-org/llama.cpp/blob/master/tools/llama-bench)

[Permalink: llama-bench](https://github.com/ggml-org/llama.cpp#llama-bench)

#### Benchmark the performance of the inference for various parameters.

[Permalink: Benchmark the performance of the inference for various parameters.](https://github.com/ggml-org/llama.cpp#benchmark-the-performance-of-the-inference-for-various-parameters)

- Run default benchmark



```
llama-bench -m model.gguf

# Output:
# | model               |       size |     params | backend    | threads |          test |                  t/s |
# | ------------------- | ---------: | ---------: | ---------- | ------: | ------------: | -------------------: |
# | qwen2 1.5B Q4_0     | 885.97 MiB |     1.54 B | Metal,BLAS |      16 |         pp512 |      5765.41 ± 20.55 |
# | qwen2 1.5B Q4_0     | 885.97 MiB |     1.54 B | Metal,BLAS |      16 |         tg128 |        197.71 ± 0.81 |
#
# build: 3e0ba0e60 (4229)
```


## [`llama-run`](https://github.com/ggml-org/llama.cpp/blob/master/tools/run)

[Permalink: llama-run](https://github.com/ggml-org/llama.cpp#llama-run)

#### A comprehensive example for running `llama.cpp` models. Useful for inferencing. Used with RamaLama [2](https://github.com/ggml-org/llama.cpp\#user-content-fn-3-1650c31f15651ba7302c80f83adc18a6).

[Permalink: A comprehensive example for running llama.cpp models. Useful for inferencing. Used with RamaLama .](https://github.com/ggml-org/llama.cpp#a-comprehensive-example-for-running-llamacpp-models-useful-for-inferencing-used-with-ramalama-2)

- Run a model with a specific prompt (by default it's pulled from Ollama registry)



```
llama-run granite-code
```


## [`llama-simple`](https://github.com/ggml-org/llama.cpp/blob/master/examples/simple)

[Permalink: llama-simple](https://github.com/ggml-org/llama.cpp#llama-simple)

#### A minimal example for implementing apps with `llama.cpp`. Useful for developers.

[Permalink: A minimal example for implementing apps with llama.cpp. Useful for developers.](https://github.com/ggml-org/llama.cpp#a-minimal-example-for-implementing-apps-with-llamacpp-useful-for-developers)

- Basic text completion



```
llama-simple -m model.gguf

# Hello my name is Kaitlyn and I am a 16 year old girl. I am a junior in high school and I am currently taking a class called "The Art of
```


## Contributing

[Permalink: Contributing](https://github.com/ggml-org/llama.cpp#contributing)

- Contributors can open PRs
- Collaborators will be invited based on contributions
- Maintainers can push to branches in the `llama.cpp` repo and merge PRs into the `master` branch
- Any help with managing issues, PRs and projects is very appreciated!
- See [good first issues](https://github.com/ggml-org/llama.cpp/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) for tasks suitable for first contributions
- Read the [CONTRIBUTING.md](https://github.com/ggml-org/llama.cpp/blob/master/CONTRIBUTING.md) for more information
- Make sure to read this: [Inference at the edge](https://github.com/ggml-org/llama.cpp/discussions/205)
- A bit of backstory for those who are interested: [Changelog podcast](https://changelog.com/podcast/532)

## Other documentation

[Permalink: Other documentation](https://github.com/ggml-org/llama.cpp#other-documentation)

- [main (cli)](https://github.com/ggml-org/llama.cpp/blob/master/tools/main/README.md)
- [server](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md)
- [GBNF grammars](https://github.com/ggml-org/llama.cpp/blob/master/grammars/README.md)

#### Development documentation

[Permalink: Development documentation](https://github.com/ggml-org/llama.cpp#development-documentation)

- [How to build](https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md)
- [Running on Docker](https://github.com/ggml-org/llama.cpp/blob/master/docs/docker.md)
- [Build on Android](https://github.com/ggml-org/llama.cpp/blob/master/docs/android.md)
- [Performance troubleshooting](https://github.com/ggml-org/llama.cpp/blob/master/docs/development/token_generation_performance_tips.md)
- [GGML tips & tricks](https://github.com/ggml-org/llama.cpp/wiki/GGML-Tips-&-Tricks)

#### Seminal papers and background on the models

[Permalink: Seminal papers and background on the models](https://github.com/ggml-org/llama.cpp#seminal-papers-and-background-on-the-models)

If your issue is with model generation quality, then please at least scan the following links and papers to understand the limitations of LLaMA models. This is especially important when choosing an appropriate model size and appreciating both the significant and subtle differences between LLaMA models and ChatGPT:

- LLaMA:
  - [Introducing LLaMA: A foundational, 65-billion-parameter large language model](https://ai.facebook.com/blog/large-language-model-llama-meta-ai/)
  - [LLaMA: Open and Efficient Foundation Language Models](https://arxiv.org/abs/2302.13971)
- GPT-3
  - [Language Models are Few-Shot Learners](https://arxiv.org/abs/2005.14165)
- GPT-3.5 / InstructGPT / ChatGPT:
  - [Aligning language models to follow instructions](https://openai.com/research/instruction-following)
  - [Training language models to follow instructions with human feedback](https://arxiv.org/abs/2203.02155)

## XCFramework

[Permalink: XCFramework](https://github.com/ggml-org/llama.cpp#xcframework)

The XCFramework is a precompiled version of the library for iOS, visionOS, tvOS,
and macOS. It can be used in Swift projects without the need to compile the
library from source. For example:

```
// swift-tools-version: 5.10
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "MyLlamaPackage",
    targets: [\
        .executableTarget(\
            name: "MyLlamaPackage",\
            dependencies: [\
                "LlamaFramework"\
            ]),\
        .binaryTarget(\
            name: "LlamaFramework",\
            url: "https://github.com/ggml-org/llama.cpp/releases/download/b5046/llama-b5046-xcframework.zip",\
            checksum: "c19be78b5f00d8d29a25da41042cb7afa094cbf6280a225abe614b03b20029ab"\
        )\
    ]
)
```

The above example is using an intermediate build `b5046` of the library. This can be modified
to use a different version by changing the URL and checksum.

## Completions

[Permalink: Completions](https://github.com/ggml-org/llama.cpp#completions)

Command-line completion is available for some environments.

#### Bash Completion

[Permalink: Bash Completion](https://github.com/ggml-org/llama.cpp#bash-completion)

```
$ build/bin/llama-cli --completion-bash > ~/.llama-completion.bash
$ source ~/.llama-completion.bash
```

Optionally this can be added to your `.bashrc` or `.bash_profile` to load it
automatically. For example:

```
$ echo "source ~/.llama-completion.bash" >> ~/.bashrc
```

## Dependencies

[Permalink: Dependencies](https://github.com/ggml-org/llama.cpp#dependencies)

- [yhirose/cpp-httplib](https://github.com/yhirose/cpp-httplib) \- Single-header HTTP server, used by `llama-server` \- MIT license
- [stb-image](https://github.com/nothings/stb) \- Single-header image format decoder, used by multimodal subsystem - Public domain
- [nlohmann/json](https://github.com/nlohmann/json) \- Single-header JSON library, used by various tools/examples - MIT License
- [minja](https://github.com/google/minja) \- Minimal Jinja parser in C++, used by various tools/examples - MIT License
- [linenoise.cpp](https://github.com/ggml-org/llama.cpp/blob/master/tools/run/linenoise.cpp/linenoise.cpp) \- C++ library that provides readline-like line editing capabilities, used by `llama-run` \- BSD 2-Clause License
- [curl](https://curl.se/) \- Client-side URL transfer library, used by various tools/examples - [CURL License](https://curl.se/docs/copyright.html)
- [miniaudio.h](https://github.com/mackron/miniaudio) \- Single-header audio format decoder, used by multimodal subsystem - Public domain

## Footnotes

1. [https://huggingface.co/docs/transformers/perplexity](https://huggingface.co/docs/transformers/perplexity) [↩](https://github.com/ggml-org/llama.cpp#user-content-fnref-1-1650c31f15651ba7302c80f83adc18a6)

2. [RamaLama](https://github.com/containers/ramalama) [↩](https://github.com/ggml-org/llama.cpp#user-content-fnref-3-1650c31f15651ba7302c80f83adc18a6)


## About

LLM inference in C/C++


### Topics

[ggml](https://github.com/topics/ggml "Topic: ggml")

### Resources

[Readme](https://github.com/ggml-org/llama.cpp#readme-ov-file)

### License

[MIT license](https://github.com/ggml-org/llama.cpp#MIT-1-ov-file)

### Contributing

[Contributing](https://github.com/ggml-org/llama.cpp#contributing-ov-file)

### Security policy

[Security policy](https://github.com/ggml-org/llama.cpp#security-ov-file)

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/ggml-org/llama.cpp).

[Activity](https://github.com/ggml-org/llama.cpp/activity)

[Custom properties](https://github.com/ggml-org/llama.cpp/custom-properties)

### Stars

[**88.4k**\\
stars](https://github.com/ggml-org/llama.cpp/stargazers)

### Watchers

[**608**\\
watching](https://github.com/ggml-org/llama.cpp/watchers)

### Forks

[**13.4k**\\
forks](https://github.com/ggml-org/llama.cpp/forks)

[Report repository](https://github.com/contact/report-content?content_url=https%3A%2F%2Fgithub.com%2Fggml-org%2Fllama.cpp&report=ggml-org+%28user%29)

## [Releases\  4,476](https://github.com/ggml-org/llama.cpp/releases)

[b6857\\
Latest\\
\\
20 minutes agoOct 27, 2025](https://github.com/ggml-org/llama.cpp/releases/tag/b6857)

[\+ 4,475 releases](https://github.com/ggml-org/llama.cpp/releases)

## [Packages\  1](https://github.com/orgs/ggml-org/packages?repo_name=llama.cpp)

- [llama.cpp](https://github.com/orgs/ggml-org/packages/container/package/llama.cpp)

### Uh oh!

There was an error while loading. [Please reload this page](https://github.com/ggml-org/llama.cpp).

## [Contributors\  1,304](https://github.com/ggml-org/llama.cpp/graphs/contributors)

- [![@ggerganov](https://avatars.githubusercontent.com/u/1991296?s=64&v=4)](https://github.com/ggerganov)
- [![@slaren](https://avatars.githubusercontent.com/u/2141330?s=64&v=4)](https://github.com/slaren)
- [![@ngxson](https://avatars.githubusercontent.com/u/7702203?s=64&v=4)](https://github.com/ngxson)
- [![@JohannesGaessler](https://avatars.githubusercontent.com/u/18492268?s=64&v=4)](https://github.com/JohannesGaessler)
- [![@CISC](https://avatars.githubusercontent.com/u/1629204?s=64&v=4)](https://github.com/CISC)
- [![@danbev](https://avatars.githubusercontent.com/u/432351?s=64&v=4)](https://github.com/danbev)
- [![@jeffbolznv](https://avatars.githubusercontent.com/u/8260565?s=64&v=4)](https://github.com/jeffbolznv)
- [![@cebtenzzre](https://avatars.githubusercontent.com/u/14168726?s=64&v=4)](https://github.com/cebtenzzre)
- [![@ikawrakow](https://avatars.githubusercontent.com/u/48489457?s=64&v=4)](https://github.com/ikawrakow)
- [![@compilade](https://avatars.githubusercontent.com/u/113953597?s=64&v=4)](https://github.com/compilade)
- [![@ochafik](https://avatars.githubusercontent.com/u/273860?s=64&v=4)](https://github.com/ochafik)
- [![@0cc4m](https://avatars.githubusercontent.com/u/11707594?s=64&v=4)](https://github.com/0cc4m)
- [![@phymbert](https://avatars.githubusercontent.com/u/5741141?s=64&v=4)](https://github.com/phymbert)
- [![@rgerganov](https://avatars.githubusercontent.com/u/271616?s=64&v=4)](https://github.com/rgerganov)

[\+ 1,290 contributors](https://github.com/ggml-org/llama.cpp/graphs/contributors)

## Languages

- [C++58.5%](https://github.com/ggml-org/llama.cpp/search?l=c%2B%2B)
- [C13.6%](https://github.com/ggml-org/llama.cpp/search?l=c)
- [Python8.4%](https://github.com/ggml-org/llama.cpp/search?l=python)
- [Cuda6.7%](https://github.com/ggml-org/llama.cpp/search?l=cuda)
- [Metal2.2%](https://github.com/ggml-org/llama.cpp/search?l=metal)
- [Svelte1.6%](https://github.com/ggml-org/llama.cpp/search?l=svelte)
- Other9.0%

You can’t perform that action at this time.

import { addToast, ApiLocator } from './index';

export class StackAnalyses {

    private stackapiUrl: string;
    private api: ApiLocator = new ApiLocator();
    private stackID: string;
    private similarStacks: any;
    private recommendations: any;
    private dependencies: any;

    constructor() {
        this.stackapiUrl = this
            .api
            .buildApiUrl(STACK_API_URL, 'recommender.api', 'api/v1');
    }

    buildStackAnalyses = () => {
        $('#pomTextConetntArea').show();
        $('#pomStatusSuccess').hide();
        $('#stackReportCntr').hide();
        $('#stackSpinner').hide();
        $('#stackAnalysesAnchor').on('click', () => {
            this.callStackAnalysesReportApi();
        });
        $('#stackAnalysesFileUpload').on('click', () => {
            this.uploadStackAnalysesFile();
        });
        $('#stackAnalysesFile').on('change', () => {
            this.updateFileList();
        });
    }

    callStackAnalysesReportApi = () => {
        event.preventDefault();
        $('#stackSpinner').show();
        $.ajax({
            url: this.stackapiUrl + 'stack-analyses/' + this.stackID,
            method: 'GET',
            dataType: 'json',
            success: response => {
                if (response.hasOwnProperty('error')) {
                    $('#stackSpinner').hide();
                    $('#stackReportCntr').hide();
                    addToast("alert-warning", "Your stack analyses is currently in progress.");
                } else {
                    $('#stackSpinner').hide();
                    $('#stackReportCntr').show();
                    this.formRecommendationList(response)
                }
            },
            error: () => {
                $('#stackSpinner').hide();
                console.log('Error calling stack report API')
            }
        });
    }

    formRecommendationList = (stackAnalysesData: any) => {
        if (stackAnalysesData.hasOwnProperty('recommendation')) {
            let recommendation: any = stackAnalysesData.recommendation.recommendations;
            let dependencies: any = stackAnalysesData.components;
            if (recommendation && recommendation.hasOwnProperty('similar_stacks') && recommendation.similar_stacks.length > 0) {
                this.similarStacks = recommendation.similar_stacks;
                const analysis: any = this.similarStacks[0].analysis;
                let missingPackages: Array<any> = analysis.missing_packages;
                let versionMismatch: Array<any> = analysis.version_mismatch;

                // Call the recommendations with the missing packages and version mismatches
                this.setRecommendations(missingPackages, versionMismatch);
            } else {
                $('#recommenderListView').html('');
                let strToAdd = `<div class="list-view-pf-main-info">
                          <div class="list-view-pf-left">
                            <span class="pficon pficon-ok"></span>
                          </div>
                          <div class="list-view-pf-body">
                            <div class="list-view-pf-description">
                              <div class="list-group-item-text">
                               <b>We have no recommendations for you.</b> Your stack looks great!
                              </div>
                            </div>
                          </div>
                        </div>`;
                $('#recommenderListView').append(strToAdd);
            }

            // Check if the data has results key
            if (stackAnalysesData.hasOwnProperty('result') && stackAnalysesData.result.length > 0) {
                let result: any = stackAnalysesData.result[0];
                if (result.hasOwnProperty('components')) {
                    let components: Array<any> = result.components;
                    // Call the stack-components with the components information so that
                    // It can parse the necessary information and show relevant things.
                    this.buildDependenciesUI(components);
                }
            }
        }
    }

    private buildDependenciesUI(dependencies: Array<any>): void {
        let length: number = dependencies.length;
        let dependencyTable: JQuery = $('#dependenciesTable');
        let tableHeader: JQuery = dependencyTable.find('thead');
        let tableBody: JQuery = dependencyTable.find('tbody');

        let keys: any = {
            name: 'name',
            currentVersion: 'curVersion',
            latestVersion: 'latestVersion',
            dateAdded: 'dateAdded',
            publicPopularity: 'pubPopularity',
            enterpriseUsage: 'enterpriseUsage',
            teamUsage: 'teamUsage'
        };
        let headers: Array<any> = [
            {
                name: 'Name',
                identifier: keys['name'],
                isSortable: true
            }, {
                name: 'Current Version',
                identifier: keys['currentVersion'],
                isSortable: true
            }, {
                name: 'Latest Version',
                identifier: keys['latestVersion']
            }, {
                name: 'Public Popularity',
                identifier: keys['publicPopularity']
            }, {
                name: 'Enterprise Usage',
                identifier: keys['enterpriseUsage'],
                isSortable: true
            }
        ];


        let dependenciesList: Array<any> = [];
        let dependency: any, eachOne: any;
        $(tableBody).empty();
        $(tableHeader).empty();
        for (let i: number = 0; i < length; ++i) {
            dependency = {};
            eachOne = dependencies[i];
            dependency[keys['name']] = eachOne['name'];
            dependency[keys['currentVersion']] = eachOne['version'];
            dependency[keys['latestVersion']] = eachOne['latest_version'] || 'NA';
            dependency[keys['publicPopularity']] =
                eachOne['github_details'] ? (eachOne['github_details'].stargazers_count === -1 ? 'NA' : eachOne['github_details'].stargazers_count) : 'NA';
            dependency[keys['enterpriseUsage']] = eachOne['enterpriseUsage'] || 'NA';

            dependenciesList.push(dependency);
        }

        this.dependencies = {
            headers: headers,
            list: dependenciesList
        };
        let headerRow: JQuery = $('<tr />').appendTo(tableHeader);
        $.map(this.dependencies.headers, (key, value) => {
            $(`<th>${key.name}</th>`).appendTo(headerRow);
        });
        $.map(this.dependencies.list, (key, value) => {
            let bodyRow: JQuery = $('<tr />').appendTo(tableBody);
            bodyRow.append(`<td>${key.name}</td>`);
            bodyRow.append(`<td>${key.curVersion}</td>`);
            bodyRow.append(`<td>${key.latestVersion}</td>`);
            bodyRow.append(`<td>${key.pubPopularity}</td>`);
            bodyRow.append(`<td>${key.enterpriseUsage}</td>`);
        });
    }

    setRecommendations = (missing: any, version: any) => {
        this.recommendations = [];
        for (let i in missing) {
            if (missing.hasOwnProperty(i)) {
                let key: any = Object.keys(missing[i]);
                let value: any;
                this.recommendations.push({
                    suggestion: 'Recommended',
                    action: 'Add',
                    message: key[0] + ' ' + missing[i][key[0]]
                });
            }
        }

        for (let i in version) {
            if (version.hasOwnProperty(i)) {
                let key: any = Object.keys(missing[i]);
                let value: any;
                this.recommendations.push({
                    suggestion: 'Recommended',
                    action: 'Upgrade',
                    message: key[0] + ' ' + version[i][key[0]]
                });
            }
        }
        this.constructRecommenderUI(this.recommendations)
    }

    constructRecommenderUI = (recommendations: any) => {
        $('#recommenderListView').html('');
        for (var i in recommendations) {
            var strToAdd = `<div class="list-view-pf-main-info">
                          <div class="list-view-pf-left">
                            <span class="pficon pficon-info"></span>
                          </div>
                          <div class="list-view-pf-body">
                            <div class="list-view-pf-description">
                              <div class="list-group-item-text">
                                ${recommendations[i].suggestion} - ${recommendations[i].action} ${recommendations[i].message}
                              </div>
                            </div>
                          </div>
                        </div>`;
            $('#recommenderListView').append(strToAdd);
        }
    }

    updateFileList = () => {
        $('#stackAnalysesFileUpload').removeAttr('disabled');
        var input = <HTMLInputElement>document.getElementById('stackAnalysesFile');
        var output = document.getElementById('fileList');

        // output.innerHTML = '<ul>';
        for (var i = 0; i < input.files.length; ++i) {
            output.innerHTML = '<span>' + input.files.item(i).name + '</span>';
        }
        // output.innerHTML += '</ul>';
    }

    uploadStackAnalysesFile = () => {
        let data = new FormData();
        $.each((<HTMLInputElement>document.getElementById('stackAnalysesFile')).files, function (key: any, value: any) {
            data.append('manifest[]', value);
        });
        $('#stackSpinner').show();
        $.ajax({
            url: this.stackapiUrl + 'stack-analyses',
            type: 'POST',
            data: data,
            cache: false,
            contentType: false,
            processData: false,
            success: data => {
                if (typeof data.error === 'undefined') {
                    $('#stackSpinner').hide();
                    addToast("alert-success", "Your stack analyses request has been successfully initiated.");
                    $('#pomStatusSuccess').show();
                    this.stackID = data.id;
                }
                else {
                    $('#stackSpinner').hide();
                    console.log('ERRORS: ' + data.error);
                }
            },
            error: () => {
                $('#stackSpinner').hide();
                console.log('ERRORS: ');
            }
        });
    }

}

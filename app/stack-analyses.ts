import { addToast } from './index'

export class StackAnalyses {

    private stackapiUrl: string;
    private stackID: string;
    private similarStacks: any;
    private recommendations: any;
    private dependencies: any;

    constructor() {
        this.stackapiUrl = 'http://api-bayesian.dev.rdu2c.fabric8.io/api/v1/';
        //'http://bayesian-api-bayesian-staging.b6ff.rh-idev.openshiftapps.com/api/v1/';
    }

    buildStackAnalyses = () => {
        $('#pomTextConetntArea').show();
        $('#pomStatusSuccess').hide();
        $('#stackReportCntr').hide();
        $('#stacAnalyseskbtn').on('click', () => {
            this.callStackAnalysesApi();
        });
        $('#stackAnalysesAnchor').on('click', () => {
            this.callStackAnalysesReportApi();
        });
    }

    callStackAnalysesApi = () => {
        let pomTextAreaValue = $('#pomTxtArea').val();
        $.ajax({
            url: this.stackapiUrl + 'manifestdata',
            headers: {
                "Authorization": "Bearer ",
                'Content-Type': "application/json"
            },
            method: 'POST',
            dataType: 'json',
            data: pomTextAreaValue,
            success: response => {
                //TODO 
                addToast("alert-success", "Successfully generated Stack ID! Reports can be viewed now.");
                $('#pomStatusSuccess').show();
                this.stackID = '8950acb76bc84235873d73d149cb9f61';
            },
            error: () => {
                //$('#pomStatusSuccess').hide();
                //$('#pomStatusFailure').show();
                console.log('Error calling stack API')
            }
        });

        //TODO:: to be removed post API is up
        $('#pomStatusSuccess').show();
        addToast("alert-success", "Successfully generated Stack ID! Reports can be viewed now.");
        this.stackID = '8950acb76bc84235873d73d149cb9f61';
    }

    callStackAnalysesReportApi = () => {
        $.ajax({
            url: this.stackapiUrl + 'stack-analyses/' + this.stackID,
            method: 'GET',
            dataType: 'json',
            success: response => {
                $('#stackReportCntr').show();
                this.formRecommendationList(response)
            },
            error: () => {
                console.log('Error calling stack report API')
            }
        });
    }

    formRecommendationList = (stackAnalysesData: any) => {
        if (stackAnalysesData.hasOwnProperty('recommendation')) {
            let recommendation: any = stackAnalysesData.recommendation.recommendations;
            let dependencies: any = stackAnalysesData.components;
            if (recommendation) {
                this.similarStacks = recommendation.similar_stacks;
                const analysis: any = this.similarStacks[0].analysis;
                let missingPackages: Array<any> = analysis.missing_packages;
                let versionMismatch: Array<any> = analysis.version_mismatch;

                // Call the recommendations with the missing packages and version mismatches
                this.setRecommendations(missingPackages, versionMismatch);
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
                this.recommendations.push({
                    suggestion: 'Recommended',
                    action: 'Add',
                    message: i + ' ' + missing[i]
                });
            }
        }

        for (let i in version) {
            if (version.hasOwnProperty(i)) {
                this.recommendations.push({
                    suggestion: 'Recommended',
                    action: 'Upgrade',
                    message: i + ' ' + version[i]
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

}
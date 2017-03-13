export class StackAnalyses {

    private stackapiUrl: string;
    private stackID: string;
    private similarStacks: any;
    private recommendations: any;

    constructor() {
        this.stackapiUrl = 'http://api-bayesian.dev.rdu2c.fabric8.io/api/v1/';
        //'http://bayesian-api-bayesian-staging.b6ff.rh-idev.openshiftapps.com/api/v1/';
    }

    buildStackAnalyses = () => {
        $('#pomTextConetntArea').show();
        $('#pomStatus').hide();
        $('#stacAnalyseskbtn').on('click', () => {
            let pomTextAreaValue = $('#pomTxtArea').val()
            alert('am stack!' + pomTextAreaValue);
            this.callStackAnalysesApi();
        });
        $('#stackAnalysesAnchor').on('click', () => {
            alert('am stack report!');
            this.callStackAnalysesReportApi();
        });
    }

    callStackAnalysesApi = () => {
        $.ajax({
            url: this.stackapiUrl + 'login/refresh',
            headers: {
                "Authorization": "Bearer ",
                'Content-Type': "application/json"
            },
            method: 'POST',
            dataType: 'json',
            data: JSON.stringify({}),
            success: response => {
                //TODO 
            },
            error: () => {
                console.log('Error calling stack API')
            }
        });

        //on success of API call
        // $('#pomTextConetntArea').hide();
        $('#pomStatus').show();
        this.stackID = '8950acb76bc84235873d73d149cb9f61';
    }

    callStackAnalysesReportApi = () => {
        $.ajax({
            url: this.stackapiUrl + 'stack-analyses/' + this.stackID,
            method: 'GET',
            dataType: 'json',
            success: response => {
                //TODO 
                debugger;
                alert('success' + response);
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
            if (recommendation) {
                this.similarStacks = recommendation.similar_stacks;
                const analysis: any = this.similarStacks[0].analysis;
                let missingPackages: Array<any> = analysis.missing_packages;
                let versionMismatch: Array<any> = analysis.version_mismatch;

                // Call the recommendations with the missing packages and version mismatches
                this.setRecommendations(missingPackages, versionMismatch);
            }
        }
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